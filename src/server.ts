import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getAddress, type Address, type Hex } from "viem";
import type Database from "better-sqlite3";
import type { Env, ChainProfile } from "./config.js";
import { KeeperHubClient } from "./keeperhub.js";
import { bandFor, PricingError, type Band } from "./pricing.js";
import { verifyPayment, buildSettlementCall, type TransferAuthorization } from "./x402.js";
import { filterInput } from "./filter.js";
import { creditProvider } from "./ledger.js";
import { runTier0 } from "./node/tier0.js";
import { signAttestation, sha256Hex, type AttestationInput } from "./attest.js";
import { randomUUID } from "node:crypto";

/** House adapter: what the router itself can serve tonight, in-process,
 * before the WS provider-node registry (dispatch.ts) takes over routing.
 * SPEC.md §10 lists /v1/models as reflecting "what online nodes can
 * actually serve right now" — this is that surface's floor. */
const HOUSE_MODELS = ["claude-code/sonnet", "claude-code/opus", "claude-code/haiku"] as const;
const MAX_JOB_BUDGET_USD = 1.0;
const HOUSE_PROVIDER_ID = "house";

function modelToClaudeAlias(model: string): string {
  const bare = model.replace(/^claude-code\//, "");
  if (!["sonnet", "opus", "haiku"].includes(bare)) {
    throw new PricingError(`unknown model ${model}`, 400);
  }
  return bare;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string }>;
}

function extractPromptText(messages: AnthropicMessage[]): string {
  return messages
    .map((m) => {
      const text = typeof m.content === "string" ? m.content : m.content.map((c) => c.text ?? "").join("\n");
      return `${m.role}: ${text}`;
    })
    .join("\n\n");
}

interface X402Payment {
  auth: TransferAuthorization;
  signature: Hex;
}

function decodePaymentHeader(header: string): X402Payment | null {
  try {
    const json = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    return {
      auth: {
        from: getAddress(json.from),
        to: getAddress(json.to),
        value: BigInt(json.value),
        validAfter: BigInt(json.validAfter),
        validBefore: BigInt(json.validBefore),
        nonce: json.nonce as Hex,
      },
      signature: json.signature as Hex,
    };
  } catch {
    return null;
  }
}

function nonceUnused(db: Database.Database, nonce: string): boolean {
  const existing = db.prepare(`SELECT 1 FROM eip3009_nonces WHERE nonce = ?`).get(nonce);
  if (existing) return false;
  db.prepare(`INSERT INTO eip3009_nonces (nonce, used_at) VALUES (?, ?)`).run(nonce, Date.now());
  return true;
}

function releaseNonce(db: Database.Database, nonce: string): void {
  db.prepare(`DELETE FROM eip3009_nonces WHERE nonce = ?`).run(nonce);
}

export interface ServerDeps {
  env: Env;
  chainProfile: ChainProfile;
  db: Database.Database;
  keeperhub: KeeperHubClient;
  houseNodeKeypair: { publicKeyHex: string; privateKeyDer: Buffer };
  credentialsPath: string;
}

export function buildServer(deps: ServerDeps): Hono {
  const { env, chainProfile, db, keeperhub, houseNodeKeypair, credentialsPath } = deps;
  const app = new Hono();

  ensureHouseProvider(db);

  app.get("/v1/models", (c) => {
    return c.json({
      object: "list",
      data: HOUSE_MODELS.map((id) => ({ id, object: "model" })),
    });
  });

  app.post("/v1/messages", async (c) => {
    let body: { model: string; max_tokens: number; messages: AnthropicMessage[] };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { type: "invalid_request_error", message: "invalid JSON body" } }, 400);
    }

    let band: Band;
    try {
      band = bandFor(body.model, body.max_tokens ?? 256);
    } catch (e) {
      if (e instanceof PricingError) return c.json({ error: { type: "invalid_request_error", message: e.message } }, e.httpStatus as 400);
      throw e;
    }

    let claudeModel: string;
    try {
      claudeModel = modelToClaudeAlias(body.model);
    } catch (e) {
      return c.json({ error: { type: "invalid_request_error", message: (e as Error).message } }, 400);
    }

    const promptText = extractPromptText(body.messages ?? []);
    const filterResult = filterInput(promptText);
    if (!filterResult.allowed) {
      return c.json({ error: { type: "invalid_request_error", message: filterResult.reason } }, 400);
    }

    // --- Auth: prepaid key or x402 challenge/settle (SPEC.md D9) ---
    const apiKey = c.req.header("x-api-key");
    let prepaidKeyHash: string | null = null;
    let payment: X402Payment | null = null;

    if (apiKey?.startsWith("ipx_sk_")) {
      const keyHash = sha256Hex(apiKey);
      const row = db.prepare(`SELECT balance_micros AS balance FROM consumer_keys WHERE key_hash = ?`).get(keyHash) as
        | { balance: string }
        | undefined;
      if (!row || BigInt(row.balance) < band.priceMicros) {
        return c.json({ error: { type: "payment_required", message: "insufficient prepaid balance" } }, 402);
      }
      prepaidKeyHash = keyHash;
      db.prepare(`UPDATE consumer_keys SET balance_micros = balance_micros - ? WHERE key_hash = ?`).run(
        band.priceMicros.toString(),
        keyHash,
      );
    } else {
      const paymentHeader = c.req.header("x-payment");
      if (!paymentHeader) {
        return c.json(
          {
            error: { type: "payment_required", message: "pay via X-PAYMENT or x-api-key" },
            accepts: [
              {
                scheme: "exact",
                network: "base-sepolia",
                asset: chainProfile.usdcAddress,
                maxAmountRequired: band.priceMicros.toString(),
                payTo: env.PAY_TO_ADDRESS,
              },
            ],
          },
          402,
        );
      }
      const decoded = decodePaymentHeader(paymentHeader);
      if (!decoded) {
        return c.json({ error: { type: "payment_required", message: "malformed X-PAYMENT header" } }, 402);
      }
      const verified = await verifyPayment(decoded.auth, decoded.signature, chainProfile.eip712Domain, {
        payTo: getAddress(env.PAY_TO_ADDRESS),
        minValue: band.priceMicros,
      });
      if (!verified.ok) {
        return c.json({ error: { type: "payment_required", message: verified.reason } }, 402);
      }
      if (!nonceUnused(db, decoded.auth.nonce)) {
        return c.json({ error: { type: "payment_required", message: "nonce already used (replay)" } }, 402);
      }
      payment = decoded;
    }

    // --- Dispatch: house Tier-0 node, in-process (SPEC.md §5, PLAN.md 0.3) ---
    const jobId = randomUUID();
    const result = await runTier0({
      jobId,
      prompt: promptText,
      model: claudeModel,
      maxBudgetUsd: MAX_JOB_BUDGET_USD,
      credentialsPath,
      timeoutMs: 90_000,
    });

    if (!result.ok) {
      // Never settle on a failed job. Refund a debited prepaid balance; an
      // unused x402 authorization simply expires (SPEC.md §6).
      if (prepaidKeyHash) {
        db.prepare(`UPDATE consumer_keys SET balance_micros = balance_micros + ? WHERE key_hash = ?`).run(
          band.priceMicros.toString(),
          prepaidKeyHash,
        );
      }
      if (payment) releaseNonce(db, payment.auth.nonce);
      return c.json({ error: { type: "api_error", message: result.error ?? "generation failed" } }, 502);
    }

    // --- Settle (x402 path only — prepaid already settled at top-up) ---
    let settlementTx: string | undefined;
    if (payment) {
      const call = buildSettlementCall(payment.auth, payment.signature, chainProfile.usdcAddress, chainProfile.chainId);
      const sim = await keeperhub.simulateContractCall(call);
      if (sim.wouldRevert) {
        releaseNonce(db, payment.auth.nonce);
        return c.json({ error: { type: "api_error", message: `settlement would revert: ${sim.revertReason}` } }, 502);
      }
      const broadcast = await keeperhub.contractCall(call, payment.auth.nonce);
      if ("kind" in broadcast) {
        return c.json({ error: { type: "api_error", message: `settlement ${broadcast.kind}` } }, 502);
      }
      const final = await keeperhub.pollToTerminal(broadcast.executionId);
      if (final.status !== "completed" || !final.receipts.every((r) => r.verified)) {
        return c.json({ error: { type: "api_error", message: "settlement failed to verify" } }, 502);
      }
      settlementTx = final.transactionHash;
      db.prepare(
        `INSERT INTO payments_in (id, kind, amount_micros, payer, nonce, settlement_tx, settlement_status, created_at)
         VALUES (?, 'x402', ?, ?, ?, ?, 'settled', ?)`,
      ).run(jobId, band.priceMicros.toString(), payment.auth.from, payment.auth.nonce, settlementTx, Date.now());
    }

    // --- Attest + credit + record ---
    const attestationInput: AttestationInput = {
      requestId: jobId,
      adapter: "claude-code",
      modelReported: result.modelReported ?? claudeModel,
      promptHash: sha256Hex(promptText),
      outputHash: sha256Hex(result.text ?? ""),
      inputTokens: result.inputTokens ?? 0,
      outputTokens: result.outputTokens ?? 0,
      costUsdMicros: BigInt(Math.round((result.costUsd ?? 0) * 1_000_000)),
    };
    const attestation = signAttestation(attestationInput, houseNodeKeypair.privateKeyDer);

    creditProvider(db, HOUSE_PROVIDER_ID, band);
    db.prepare(
      `INSERT INTO jobs (id, node_id, payment_id, model, band, status, cost_usd_micros, input_tokens, output_tokens, attestation, created_at, completed_at)
       VALUES (?, NULL, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)`,
    ).run(
      jobId,
      payment ? jobId : null,
      body.model,
      band.id,
      attestationInput.costUsdMicros.toString(),
      attestationInput.inputTokens,
      attestationInput.outputTokens,
      attestation,
      Date.now(),
      Date.now(),
    );

    c.header("x-idleproxy-attestation", attestation);
    c.header("x-idleproxy-node", HOUSE_PROVIDER_ID);
    if (settlementTx) c.header("x-idleproxy-settlement-tx", settlementTx);

    return c.json({
      id: `msg_${jobId}`,
      type: "message",
      role: "assistant",
      model: body.model,
      content: [{ type: "text", text: result.text }],
      stop_reason: "end_turn",
      usage: { input_tokens: result.inputTokens ?? 0, output_tokens: result.outputTokens ?? 0 },
    });
  });

  app.use("/*", serveStatic({ root: "./public" }));

  return app;
}

function ensureHouseProvider(db: Database.Database): void {
  const existing = db.prepare(`SELECT 1 FROM providers WHERE id = ?`).get(HOUSE_PROVIDER_ID);
  if (!existing) {
    db.prepare(`INSERT INTO providers (id, wallet, created_at) VALUES (?, ?, ?)`).run(
      HOUSE_PROVIDER_ID,
      "0x0000000000000000000000000000000000dEaD",
      Date.now(),
    );
  }
}

export function startServer(app: Hono, port: number): void {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`idleproxy router listening on :${info.port}`);
  });
}
