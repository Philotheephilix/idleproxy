import type { Env } from "./config.js";

/**
 * KeeperHub Direct Execution client. Every write goes through the
 * simulate -> broadcast -> poll sequence documented in
 * docs/keeperhub/api/direct-execution.md. "Would revert" arrives as HTTP 400
 * with a `wouldRevert` field, not a 200 with a flag — SPEC.md §9, PLAN.md
 * demo-day failure modes. This client parses the body before treating a 400
 * as an error.
 */

export interface SimulateResult {
  success: boolean;
  status: "simulated";
  from?: string;
  to?: string;
  value?: string;
  gasEstimate?: string;
  simulatedReturnValue?: unknown;
  wouldRevert?: boolean;
  revertReason?: string;
  error?: string;
  code?: string;
}

export interface Receipt {
  hash: string;
  chainId: number;
  verified: boolean;
  receiptStatus: "success" | "reverted" | "safe_inner_failure" | "not_found" | "timeout";
  blockNumber?: number;
  gasUsed?: string;
  verifiedAt?: string;
}

export interface ExecutionStatus {
  executionId: string;
  status: "pending" | "running" | "completed" | "failed";
  type?: string;
  transactionHash?: string;
  transactionLink?: string;
  sponsored?: boolean;
  receipts: Receipt[];
  result?: unknown;
  error?: string | null;
  idempotentReplay?: boolean;
}

export interface IdempotencyConflict {
  kind: "idempotency_conflict";
  originalExecutionId: string | null;
}

export interface IdempotencyInProgress {
  kind: "idempotency_in_progress";
}

export class KeeperHubError extends Error {
  constructor(message: string, public readonly body: unknown, public readonly status: number) {
    super(message);
  }
}

interface ContractCallBody {
  contractAddress: string;
  chainId: number;
  functionName: string;
  functionArgs: string; // JSON array string, per API contract
  abi: string; // JSON string, per API contract
  value?: string;
  gasLimitMultiplier?: string;
  simulate?: boolean;
}

interface TransferBody {
  chainId: number;
  recipientAddress: string;
  amount: string;
  tokenAddress?: string;
  gasLimitMultiplier?: string;
  simulate?: boolean;
}

export class KeeperHubClient {
  private readonly base: string;
  private readonly apiKey: string;

  constructor(env: Pick<Env, "KEEPERHUB_API_BASE" | "KEEPERHUB_API_KEY">) {
    this.base = env.KEEPERHUB_API_BASE.replace(/\/$/, "");
    this.apiKey = env.KEEPERHUB_API_KEY;
  }

  private async request(
    path: string,
    body: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<{ status: number; json: any; headers: Headers }> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json, headers: res.headers };
  }

  /** Simulate a contract call. Never throws on wouldRevert — that is data, not a transport error. */
  async simulateContractCall(body: Omit<ContractCallBody, "simulate">): Promise<SimulateResult> {
    const { json, status } = await this.request("/execute/contract-call", { ...body, simulate: true });
    if (status !== 200 && status !== 400) {
      throw new KeeperHubError(`simulate contract-call: unexpected status ${status}`, json, status);
    }
    return json as SimulateResult;
  }

  async simulateTransfer(body: Omit<TransferBody, "simulate">): Promise<SimulateResult> {
    const { json, status } = await this.request("/execute/transfer", { ...body, simulate: true });
    if (status !== 200 && status !== 400) {
      throw new KeeperHubError(`simulate transfer: unexpected status ${status}`, json, status);
    }
    return json as SimulateResult;
  }

  /**
   * Broadcast a contract call. Returns the execution id, or a typed
   * idempotency outcome — both are answers, not exceptions (PLAN.md §2.2).
   */
  async contractCall(
    body: Omit<ContractCallBody, "simulate">,
    idempotencyKey: string,
  ): Promise<{ executionId: string; status: string } | IdempotencyConflict | IdempotencyInProgress> {
    const { json, status } = await this.request("/execute/contract-call", body, idempotencyKey);
    return this.interpretBroadcast(status, json);
  }

  async transfer(
    body: Omit<TransferBody, "simulate">,
    idempotencyKey: string,
  ): Promise<{ executionId: string; status: string } | IdempotencyConflict | IdempotencyInProgress> {
    const { json, status } = await this.request("/execute/transfer", body, idempotencyKey);
    return this.interpretBroadcast(status, json);
  }

  async checkAndExecute(
    body: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<any> {
    const { json, status } = await this.request("/execute/check-and-execute", body, idempotencyKey);
    if (status === 409) return this.interpretConflict(json);
    return json;
  }

  private interpretBroadcast(
    status: number,
    json: any,
  ): { executionId: string; status: string } | IdempotencyConflict | IdempotencyInProgress {
    if (status === 409) return this.interpretConflict(json);
    if (status === 202 || status === 200) {
      return { executionId: json.executionId, status: json.status };
    }
    throw new KeeperHubError(`broadcast failed: HTTP ${status}`, json, status);
  }

  private interpretConflict(json: any): IdempotencyConflict | IdempotencyInProgress {
    if (json.error === "idempotency_in_progress") return { kind: "idempotency_in_progress" };
    return { kind: "idempotency_conflict", originalExecutionId: json.originalExecutionId ?? null };
  }

  /** Poll status honoring X-Poll-Interval-Hint (0 = terminal). Caller drives the loop. */
  async getStatus(executionId: string): Promise<{ status: ExecutionStatus; pollIntervalHint: number }> {
    const res = await fetch(`${this.base}/execute/${executionId}/status`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const json = (await res.json()) as ExecutionStatus;
    if (res.status !== 200) throw new KeeperHubError(`status check failed: HTTP ${res.status}`, json, res.status);
    const hint = Number(res.headers.get("X-Poll-Interval-Hint") ?? "3");
    return { status: json, pollIntervalHint: Number.isFinite(hint) ? hint : 3 };
  }

  /** Recent runs of a workflow — used to surface the Solvency Watchdog's
   * Condition results as the reconciliation "alert" (SPEC.md §10), since
   * the Send Webhook and Code actions are gated behind a paid plan on this
   * org tier and can't broadcast an alert themselves. */
  async listWorkflowExecutions(workflowId: string, limit = 10): Promise<any[]> {
    const res = await fetch(`${this.base}/workflows/${workflowId}/executions`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (res.status !== 200) return [];
    const all = (await res.json()) as any[];
    return all.slice(0, limit);
  }

  /** Poll to a terminal state, honoring the server's hinted interval each round. */
  async pollToTerminal(executionId: string, maxWaitMs = 120_000): Promise<ExecutionStatus> {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const { status, pollIntervalHint } = await this.getStatus(executionId);
      if (status.status === "completed" || status.status === "failed") return status;
      await new Promise((r) => setTimeout(r, Math.max(pollIntervalHint, 1) * 1000));
    }
    throw new KeeperHubError(`polling timed out after ${maxWaitMs}ms`, { executionId }, 0);
  }
}

export function isConflict(x: unknown): x is IdempotencyConflict {
  return typeof x === "object" && x !== null && (x as any).kind === "idempotency_conflict";
}

export function isInProgress(x: unknown): x is IdempotencyInProgress {
  return typeof x === "object" && x !== null && (x as any).kind === "idempotency_in_progress";
}
