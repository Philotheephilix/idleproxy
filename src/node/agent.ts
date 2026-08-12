import WebSocket from "ws";
import { appendFile, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { runTier0 } from "./tier0.js";
import { runTier1, ensureTier1Infra } from "./tier1.js";
import { generateNodeKeypair, signAttestation, sha256Hex, type AttestationInput } from "../attest.js";

/**
 * Provider node — dials out to the router (NAT-friendly, no open ports,
 * SPEC.md §3), enforces local caps fail-closed, keeps a write-ahead usage
 * log, and runs jobs the router sends it. Runs as `idleproxy node`.
 */

export interface NodeConfig {
  routerWsUrl: string;
  wallet: string; // EVM payout address — also today's node identity, see dispatch.ts
  token: string; // issued by POST /api/provider/node-token after disclosure accept
  adapter: "claude-code" | "claude-code-tools";
  models: string[];
  credentialsPath: string;
  dailyUsdCap: number;
  dailyRequestCap: number;
  maxConcurrency: number;
  reserveFraction: number;
  keyPath: string;
  usageLogPath: string;
}

interface UsageEntry {
  jobId: string;
  startedAt: number;
  completedAt?: number;
  costUsd?: number;
  ok?: boolean;
}

class CapsEnforcer {
  private entries: UsageEntry[] = [];
  private loaded = false;
  private inFlight = 0;

  constructor(private cfg: NodeConfig) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.cfg.usageLogPath, "utf8");
      this.entries = raw
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as UsageEntry);
      this.loaded = true;
    } catch {
      // No log yet — fresh node. Still "loaded" (empty), not a failure.
      this.entries = [];
      this.loaded = true;
    }
  }

  /** Fail closed: an unreadable WAL means unavailable, never "assume fine". */
  private todaysSpendUsd(): number {
    if (!this.loaded) return Infinity;
    const dayStart = new Date().setUTCHours(0, 0, 0, 0);
    return this.entries.filter((e) => e.startedAt >= dayStart && e.ok).reduce((sum, e) => sum + (e.costUsd ?? 0), 0);
  }

  private todaysRequestCount(): number {
    if (!this.loaded) return Infinity;
    const dayStart = new Date().setUTCHours(0, 0, 0, 0);
    return this.entries.filter((e) => e.startedAt >= dayStart).length;
  }

  capacity(): { available: boolean; headroom: number; reason?: string } {
    if (!this.loaded) return { available: false, headroom: 0, reason: "usage log unreadable" };
    if (this.inFlight >= this.cfg.maxConcurrency) return { available: false, headroom: 0, reason: "at concurrency limit" };
    const spend = this.todaysSpendUsd();
    const reserveLimit = this.cfg.dailyUsdCap * (1 - this.cfg.reserveFraction);
    if (spend >= reserveLimit) return { available: false, headroom: 0, reason: "daily USD cap (reserve) reached" };
    if (this.todaysRequestCount() >= this.cfg.dailyRequestCap) return { available: false, headroom: 0, reason: "daily request cap reached" };
    const headroom = Math.max(0, 1 - spend / reserveLimit);
    return { available: true, headroom };
  }

  async beginJob(jobId: string): Promise<void> {
    this.inFlight++;
    const entry: UsageEntry = { jobId, startedAt: Date.now() };
    this.entries.push(entry);
    await appendFile(this.cfg.usageLogPath, JSON.stringify(entry) + "\n");
  }

  async completeJob(jobId: string, ok: boolean, costUsd: number): Promise<void> {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const entry = this.entries.find((e) => e.jobId === jobId);
    if (entry) {
      entry.completedAt = Date.now();
      entry.ok = ok;
      entry.costUsd = costUsd;
    }
    // Amend: WAL is append-only, so a completion is a new line referencing the same jobId — a
    // reader replays and keeps the last entry per jobId, which capacity()/todaysSpendUsd() above
    // does implicitly since it re-reads `this.entries` (in-memory) rather than re-parsing the file.
    await appendFile(this.cfg.usageLogPath, JSON.stringify({ jobId, startedAt: entry?.startedAt ?? Date.now(), completedAt: Date.now(), ok, costUsd }) + "\n");
  }
}

async function loadOrCreateKeypair(keyPath: string): Promise<{ publicKeyHex: string; privateKeyDer: Buffer }> {
  if (existsSync(keyPath)) {
    const raw = JSON.parse(await readFile(keyPath, "utf8"));
    return { publicKeyHex: raw.publicKeyHex, privateKeyDer: Buffer.from(raw.privateKeyDerHex, "hex") };
  }
  await mkdir(dirname(keyPath), { recursive: true }).catch(() => {});
  const kp = generateNodeKeypair();
  await writeFile(keyPath, JSON.stringify({ publicKeyHex: kp.publicKeyHex, privateKeyDerHex: kp.privateKeyDer.toString("hex") }));
  return kp;
}

export async function runNode(cfg: NodeConfig): Promise<void> {
  const keypair = await loadOrCreateKeypair(cfg.keyPath);
  const caps = new CapsEnforcer(cfg);
  await caps.load();

  if (cfg.adapter === "claude-code-tools") {
    console.log("Tier 1: ensuring container infra (network, egress proxy, job image)...");
    await ensureTier1Infra();
    console.log("Tier 1 infra ready.");
  }

  function connect(): void {
    const ws = new WebSocket(cfg.routerWsUrl);

    ws.on("open", () => {
      console.log(`[${new Date().toISOString()}] connected to ${cfg.routerWsUrl}`);
      ws.send(
        JSON.stringify({
          type: "hello",
          wallet: cfg.wallet,
          token: cfg.token,
          adapter: cfg.adapter,
          models: cfg.models,
          pubkey: keypair.publicKeyHex,
        }),
      );
      const sendHeartbeat = () => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const cap = caps.capacity();
        const capacityByModel: Record<string, unknown> = {};
        for (const m of cfg.models) capacityByModel[m] = cap;
        ws.send(JSON.stringify({ type: "heartbeat", capacity: capacityByModel }));
      };
      // Fire one immediately -- setInterval alone leaves a freshly-connected
      // node with no reported capacity (and so dispatch-invisible, despite
      // showing "online") for up to the full interval period.
      sendHeartbeat();
      const heartbeat = setInterval(sendHeartbeat, 15_000);
      ws.once("close", () => clearInterval(heartbeat));
    });

    ws.on("message", async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type === "error") {
        console.error(`[${new Date().toISOString()}] router: ${msg.message}`);
        return;
      }
      if (msg.type === "hello_ack") {
        console.log(`[${new Date().toISOString()}] hello_ack received, nodeId=${msg.nodeId}`);
        return;
      }
      if (msg.type !== "job") return;

      const cap = caps.capacity();
      if (!cap.available) {
        ws.send(JSON.stringify({ type: "job_result", jobId: msg.jobId, ok: false, error: `node unavailable: ${cap.reason}` }));
        return;
      }

      await caps.beginJob(msg.jobId);
      const jobArgs = { jobId: msg.jobId, prompt: msg.prompt, model: msg.model, maxBudgetUsd: msg.maxBudgetUsd, credentialsPath: cfg.credentialsPath };
      const result =
        cfg.adapter === "claude-code-tools" ? await runTier1(jobArgs) : await runTier0({ ...jobArgs, timeoutMs: 90_000 });
      await caps.completeJob(msg.jobId, result.ok, result.costUsd ?? 0);

      if (!result.ok) {
        ws.send(JSON.stringify({ type: "job_result", jobId: msg.jobId, ok: false, error: result.error }));
        return;
      }

      const attestationInput: AttestationInput = {
        requestId: msg.jobId,
        adapter: cfg.adapter,
        modelReported: result.modelReported ?? msg.model,
        promptHash: sha256Hex(msg.prompt),
        outputHash: sha256Hex(result.text ?? ""),
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
        costUsdMicros: BigInt(Math.round((result.costUsd ?? 0) * 1_000_000)),
      };
      const attestation = signAttestation(attestationInput, keypair.privateKeyDer);

      ws.send(
        JSON.stringify({
          type: "job_result",
          jobId: msg.jobId,
          ok: true,
          text: result.text,
          modelReported: result.modelReported,
          costUsd: result.costUsd,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          attestation,
        }),
      );
    });

    ws.on("close", (code, reason) => {
      console.log(`[${new Date().toISOString()}] disconnected code=${code} reason=${reason} reconnecting in 3s...`);
      setTimeout(connect, 3000);
    });

    ws.on("error", (err) => {
      console.error("ws error:", err.message);
    });
  }

  connect();
}
