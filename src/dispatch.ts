import type { WebSocket } from "ws";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { verifyAttestation, type AttestationInput } from "./attest.js";

/**
 * Router-side provider-node registry. Nodes dial out over WebSocket
 * (SPEC.md §3 — NAT-friendly, no open ports); this module tracks who's
 * connected, what they can serve right now, and dispatches + retries jobs
 * against them, falling back to the in-process house node when nothing
 * else is available (SPEC.md §6 "house-node fallback").
 */

export interface NodeCapacity {
  available: boolean;
  headroom: number; // 0..1
  reason?: string;
  resetAt?: number;
}

export interface ConnectedNode {
  nodeId: string;
  providerId: string;
  wallet: string;
  adapter: string;
  models: string[];
  pubkey: string;
  ws: WebSocket;
  capacity: Map<string, NodeCapacity>;
  lastHeartbeatAt: number;
}

export interface JobRequest {
  jobId: string;
  prompt: string;
  model: string; // claude alias: "sonnet" | "opus" | "haiku"
  maxBudgetUsd: number;
}

export interface JobResultMessage {
  type: "job_result";
  jobId: string;
  ok: boolean;
  text?: string;
  modelReported?: string;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  attestation?: string;
}

interface PendingJob {
  resolve: (msg: JobResultMessage) => void;
  reject: (err: Error) => void;
  timeout: NodeJS.Timeout;
}

export class NodeRegistry {
  private nodes = new Map<string, ConnectedNode>();
  private pending = new Map<string, PendingJob>();

  constructor(private db: Database.Database) {}

  register(node: ConnectedNode): void {
    this.nodes.set(node.nodeId, node);
    this.db
      .prepare(
        `INSERT INTO nodes (id, provider_id, adapter, pubkey, status, daily_usd_cap_micros, daily_request_cap, max_concurrency, reserve_fraction, last_heartbeat_at, created_at)
         VALUES (?, ?, ?, ?, 'online', 0, 0, 1, 0.2, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = 'online', pubkey = excluded.pubkey, last_heartbeat_at = excluded.last_heartbeat_at`,
      )
      .run(node.nodeId, node.providerId, node.adapter, node.pubkey, Date.now(), Date.now());
  }

  unregister(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.db.prepare(`UPDATE nodes SET status = 'offline' WHERE id = ?`).run(nodeId);
  }

  updateCapacity(nodeId: string, capacity: Record<string, NodeCapacity>): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    node.lastHeartbeatAt = Date.now();
    for (const [model, cap] of Object.entries(capacity)) {
      node.capacity.set(model, cap);
    }
    this.db.prepare(`UPDATE nodes SET last_heartbeat_at = ? WHERE id = ?`).run(Date.now(), nodeId);
  }

  /**
   * Ranks online, capable, available nodes by headroom (highest first).
   * `qualifiedModel` is adapter-prefixed ("claude-code/sonnet" vs
   * "claude-code-tools/sonnet") so a Tier 0 and a Tier 1 node that both
   * happen to serve the bare model "sonnet" never collide — `node.models`
   * and the capacity map stay bare internally (they match what the node
   * itself and the CLI --model flag use), so the qualification happens
   * only at the lookup boundary here.
   */
  candidatesFor(qualifiedModel: string): ConnectedNode[] {
    return [...this.nodes.values()]
      .filter((n) => n.models.some((m) => `${n.adapter}/${m}` === qualifiedModel))
      .filter((n) => {
        const bareModel = qualifiedModel.slice(n.adapter.length + 1);
        return n.capacity.get(bareModel)?.available !== false;
      })
      .sort((a, b) => {
        const bareA = qualifiedModel.slice(a.adapter.length + 1);
        const bareB = qualifiedModel.slice(b.adapter.length + 1);
        return (b.capacity.get(bareB)?.headroom ?? 1) - (a.capacity.get(bareA)?.headroom ?? 1);
      });
  }

  resolveJobResult(msg: JobResultMessage): void {
    const p = this.pending.get(msg.jobId);
    if (!p) return;
    clearTimeout(p.timeout);
    this.pending.delete(msg.jobId);
    p.resolve(msg);
  }

  handleDisconnect(ws: WebSocket): void {
    for (const [id, node] of this.nodes) {
      if (node.ws === ws) {
        this.unregister(id);
        break;
      }
    }
  }

  /** Sends a job to a specific node and awaits its result, or times out. */
  private dispatchToNode(node: ConnectedNode, job: JobRequest, timeoutMs: number): Promise<JobResultMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(job.jobId);
        reject(new Error("job timed out waiting for node"));
      }, timeoutMs);
      this.pending.set(job.jobId, { resolve, reject, timeout });
      node.ws.send(JSON.stringify({ type: "job", ...job }));
    });
  }

  /**
   * Dispatches to the best-ranked remote node, retries once on a different
   * node on failure/timeout, and reports back to the caller if nothing
   * remote worked so it can fall back to the house node.
   */
  async dispatch(model: string, job: JobRequest, timeoutMs = 90_000): Promise<{ node: ConnectedNode; result: JobResultMessage } | null> {
    const candidates = this.candidatesFor(model);
    for (let i = 0; i < Math.min(candidates.length, 2); i++) {
      const node = candidates[i];
      try {
        const result = await this.dispatchToNode(node, job, timeoutMs);
        if (result.ok) return { node, result };
      } catch {
        // fall through to next candidate
      }
    }
    return null;
  }

  verifyJobAttestation(nodeId: string, input: AttestationInput, signatureHex: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    return verifyAttestation(input, signatureHex, node.pubkey);
  }

  list(): ConnectedNode[] {
    return [...this.nodes.values()];
  }
}

export function newJobId(): string {
  return randomUUID();
}
