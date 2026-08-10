import { spawn } from "node:child_process";
import type Database from "better-sqlite3";
import type { Env, ChainProfile } from "./config.js";
import { pendingPayouts, payoutIdempotencyKey, recordPayoutBroadcast, existingPayoutStatus, finalizePayout } from "./ledger.js";
import { randomUUID } from "node:crypto";

/**
 * Treasurer — an agent, not a script (SPEC.md D-list "Treasurer" actor, §6
 * outbound). Amounts and idempotency keys are computed deterministically by
 * this file, never by the model — money math is not something to trust an
 * LLM with. The agent's job is to hold the KeeperHub MCP session and place
 * the exact calls it's given, via `execute_transfer`, so the payout really
 * is agent-executed through KeeperHub rather than a bare REST call.
 */

export interface TreasurerPayoutPlan {
  providerId: string;
  wallet: string;
  amountMicros: bigint;
  amountUsdcDecimal: string; // human units, e.g. "0.016000"
  idempotencyKey: string;
  period: string;
}

function microsToUsdcDecimal(micros: bigint): string {
  const whole = micros / 1_000_000n;
  const frac = (micros % 1_000_000n).toString().padStart(6, "0");
  return `${whole}.${frac}`;
}

export function buildPayoutPlan(
  db: Database.Database,
  chainProfile: ChainProfile,
  thresholdMicros: bigint,
  period: string,
): TreasurerPayoutPlan[] {
  return pendingPayouts(db, thresholdMicros).map((p) => ({
    providerId: p.providerId,
    wallet: p.wallet,
    amountMicros: p.accruedMicros,
    amountUsdcDecimal: microsToUsdcDecimal(p.accruedMicros),
    idempotencyKey: payoutIdempotencyKey({
      providerId: p.providerId,
      period,
      chainId: chainProfile.chainId,
      address: p.wallet,
      amountMicros: p.accruedMicros,
      token: chainProfile.usdcAddress,
    }),
    period,
  }));
}

function mcpConfig(env: Env): string {
  return JSON.stringify({
    mcpServers: {
      keeperhub: {
        type: "http",
        url: env.KEEPERHUB_MCP_URL,
        headers: { Authorization: `Bearer ${env.KEEPERHUB_API_KEY}` },
      },
    },
  });
}

/**
 * The payout's business logic — solvency check, then transfer — lives in a
 * KeeperHub workflow (Webhook trigger -> Check Treasury Balance ->
 * Solvency Gate Condition -> Pay Provider), not in this file or in a raw
 * execute_transfer call. The agent's job is to hold the MCP session and
 * invoke that workflow once per payout with the exact numbers computed
 * above, then confirm the result — so the money movement is KeeperHub-
 * native and the agent-executed part is real. See docs/tx-links.md for the
 * live proof run and the workflow id in KEEPERHUB_PAYOUT_WORKFLOW_ID.
 */
function buildPrompt(plan: TreasurerPayoutPlan[], workflowId: string): string {
  const rows = plan
    .map((p, i) => `${i + 1}. to="${p.wallet}" amount="${p.amountUsdcDecimal}" providerId="${p.providerId}"`)
    .join("\n");

  return `You are the IdleProxy treasurer. Pay out exactly the following providers via the KeeperHub ` +
    `payout workflow, id "${workflowId}". Do not compute, round, or otherwise change any amount or ` +
    `address — use the values given verbatim. The workflow itself checks treasury solvency and performs ` +
    `the transfer; your job is to invoke it correctly and confirm the outcome.\n\n` +
    `Payouts:\n${rows}\n\n` +
    `For each payout, in order:\n` +
    `1. Call execute_workflow with workflowId "${workflowId}" and input ` +
    `{"body": {"to": <to>, "amount": <amount>, "providerId": <providerId>}}.\n` +
    `2. Call get_execution with the returned executionId and poll until status is a terminal state ` +
    `(success, error, or cancelled). Read the transactionHash and whether the transfer was sponsored from ` +
    `the execution's transactionHashes/output.\n\n` +
    `When all payouts are resolved, end your final message with a fenced json code block containing an ` +
    `array, one object per payout, each with exactly these fields: providerIndex (the 1-based number ` +
    `above), status ("completed" if the workflow execution succeeded, else "failed"), executionId, ` +
    `transactionHash (or null), sponsored (boolean or null).`;
}

export interface TreasurerRunResult {
  ok: boolean;
  rawText?: string;
  parsed?: Array<{ providerIndex: number; status: string; executionId: string; transactionHash: string | null; sponsored: boolean | null }>;
  error?: string;
}

function extractJsonBlock(text: string): string | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export async function runTreasurer(
  env: Env,
  plan: TreasurerPayoutPlan[],
  timeoutMs = 180_000,
): Promise<TreasurerRunResult> {
  if (plan.length === 0) return { ok: true, parsed: [] };
  if (!env.KEEPERHUB_PAYOUT_WORKFLOW_ID) {
    return { ok: false, error: "KEEPERHUB_PAYOUT_WORKFLOW_ID not configured" };
  }

  const prompt = buildPrompt(plan, env.KEEPERHUB_PAYOUT_WORKFLOW_ID);
  const allowedTools = "mcp__keeperhub__execute_workflow,mcp__keeperhub__get_execution";

  const args = [
    "-p",
    prompt,
    "--output-format",
    "json",
    "--mcp-config",
    mcpConfig(env),
    "--strict-mcp-config",
    "--allowed-tools",
    allowedTools,
    "--permission-mode",
    "bypassPermissions",
  ];

  return new Promise((resolve) => {
    const child = spawn("claude", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", () => {
      clearTimeout(timeout);
      if (!stdout.trim()) {
        resolve({ ok: false, error: stderr || "treasurer agent produced no output" });
        return;
      }
      try {
        const parsedOuter = JSON.parse(stdout);
        if (parsedOuter.is_error) {
          resolve({ ok: false, error: parsedOuter.result ?? "treasurer agent errored", rawText: stdout });
          return;
        }
        const text = parsedOuter.result ?? "";
        const jsonBlock = extractJsonBlock(text);
        const parsed = jsonBlock ? JSON.parse(jsonBlock) : undefined;
        resolve({ ok: true, rawText: text, parsed });
      } catch (e) {
        resolve({ ok: false, error: `unparseable treasurer output: ${(e as Error).message}`, rawText: stdout });
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ ok: false, error: `spawn failed: ${err.message}` });
    });
  });
}

/** Records each planned payout as broadcast before the agent runs, so a crash mid-run still leaves an audit trail. */
export function recordPlannedPayouts(db: Database.Database, plan: TreasurerPayoutPlan[]): void {
  for (const p of plan) {
    recordPayoutBroadcast(db, {
      id: randomUUID(),
      providerId: p.providerId,
      period: p.period,
      amountMicros: p.amountMicros,
      idempotencyKey: p.idempotencyKey,
      executionId: "pending",
    });
  }
}

export interface PayoutBatchResult {
  paid: Array<{ providerId: string; status: string; transactionHash: string | null }>;
  skipped: Array<{ providerId: string; reason: "verified" | "broadcast" }>;
  error?: string;
}

/**
 * The full payout-batch flow, shared by `idleproxy treasurer` and the
 * KeeperHub-scheduled /internal/settlement/run hook — one code path,
 * two triggers (SPEC.md §10 "Settlement hook").
 */
export async function runPayoutBatch(
  env: Env,
  chainProfile: ChainProfile,
  db: Database.Database,
  thresholdMicros: bigint,
): Promise<PayoutBatchResult> {
  // Full timestamp, not a date slice — see the comment on `period` at the
  // call site history: two threshold-triggered batches can land on the
  // same calendar day, and a date-only period would collide their keys.
  const period = new Date().toISOString();
  const fullPlan = buildPayoutPlan(db, chainProfile, thresholdMicros, period);
  if (fullPlan.length === 0) return { paid: [], skipped: [] };

  const skipped: PayoutBatchResult["skipped"] = [];
  const plan = fullPlan.filter((p) => {
    const status = existingPayoutStatus(db, p.idempotencyKey);
    if (status === "verified" || status === "broadcast") {
      skipped.push({ providerId: p.providerId, reason: status });
      return false;
    }
    return true;
  });
  if (plan.length === 0) return { paid: [], skipped };

  recordPlannedPayouts(db, plan);
  const result = await runTreasurer(env, plan);
  if (!result.ok) return { paid: [], skipped, error: result.error };
  if (!result.parsed) return { paid: [], skipped, error: "could not parse structured summary from agent output" };

  const paid: PayoutBatchResult["paid"] = [];
  for (const entry of result.parsed) {
    const p = plan[entry.providerIndex - 1];
    if (!p) continue;
    finalizePayout(db, p.idempotencyKey, {
      transactionLink: entry.transactionHash ? `${chainProfile.explorerBase}/tx/${entry.transactionHash}` : undefined,
      sponsored: entry.sponsored ?? undefined,
      verified: entry.status === "completed",
    });
    paid.push({ providerId: p.providerId, status: entry.status, transactionHash: entry.transactionHash });
  }
  return { paid, skipped };
}
