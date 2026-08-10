import { spawn } from "node:child_process";
import type Database from "better-sqlite3";
import type { Env, ChainProfile } from "./config.js";
import { pendingPayouts, payoutIdempotencyKey, recordPayoutBroadcast } from "./ledger.js";
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

function buildPrompt(plan: TreasurerPayoutPlan[], chainProfile: ChainProfile): string {
  const rows = plan
    .map(
      (p, i) =>
        `${i + 1}. to_address="${p.wallet}" amount="${p.amountUsdcDecimal}" idempotency_key="${p.idempotencyKey}"`,
    )
    .join("\n");

  return `You are the IdleProxy treasurer. Execute exactly the following USDC payouts on chain_id ` +
    `"${chainProfile.chainId}" using token_address "${chainProfile.usdcAddress}", via the KeeperHub MCP tools. ` +
    `Do not compute, round, or otherwise change any amount, address, or idempotency_key — use the values given verbatim.\n\n` +
    `Payouts:\n${rows}\n\n` +
    `For each payout, in order:\n` +
    `1. Call execute_transfer with chain_id, to_address, token_address, amount, and simulate=true. ` +
    `Stop and report failure for this payout if wouldRevert is true.\n` +
    `2. Call execute_transfer again with the same arguments, simulate omitted, and idempotency_key set. ` +
    `A 409 idempotency_conflict or idempotency_in_progress is an answer, not an error — treat it as `+
    `"already in flight" and proceed to polling.\n` +
    `3. Call get_direct_execution_status with the executionId and poll (respecting any backoff hint) until ` +
    `status is completed or failed.\n\n` +
    `When all payouts are resolved, end your final message with a fenced json code block containing an array, ` +
    `one object per payout, each with exactly these fields: providerIndex (the 1-based number above), status ` +
    `("completed" or "failed"), executionId, transactionHash (or null), sponsored (boolean or null).`;
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
  chainProfile: ChainProfile,
  plan: TreasurerPayoutPlan[],
  timeoutMs = 180_000,
): Promise<TreasurerRunResult> {
  if (plan.length === 0) return { ok: true, parsed: [] };

  const prompt = buildPrompt(plan, chainProfile);
  const allowedTools = "mcp__keeperhub__execute_transfer,mcp__keeperhub__get_direct_execution_status";

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
