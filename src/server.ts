import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { getAddress, verifyMessage, type Address, type Hex } from "viem";
import type Database from "better-sqlite3";
import { WebSocketServer, type WebSocket } from "ws";
import type { Env, ChainProfile } from "./config.js";
import { KeeperHubClient } from "./keeperhub.js";
import { bandFor, PricingError, BANDS, type Band } from "./pricing.js";
import { verifyPayment, buildSettlementCall, type TransferAuthorization } from "./x402.js";
import { filterInput } from "./filter.js";
import { creditProvider } from "./ledger.js";
import { runTier0 } from "./node/tier0.js";
import { signAttestation, sha256Hex, type AttestationInput } from "./attest.js";
import { NodeRegistry, newJobId, type ConnectedNode } from "./dispatch.js";
import { runPayoutBatch } from "./treasurer.js";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

/** House adapter: what the router itself can serve tonight, in-process,
 * before the WS provider-node registry (dispatch.ts) takes over routing.
 * SPEC.md §10 lists /v1/models as reflecting "what online nodes can
 * actually serve right now" — this is that surface's floor. */
const HOUSE_MODELS = ["claude-code/sonnet", "claude-code/opus", "claude-code/haiku"] as const;
// The provider's actual generation cost floor is ~$0.05 (SPEC.md §1 V2's
// measured 7.7k-token preamble), which is *above* Band S's $0.02 consumer
// price — so the budget cap can't be 1:1 with what the consumer paid, or
// every Band S job would hit it mid-preamble. Scaled instead: 5x the band
// price, floored at $0.15 so the cheapest band still reliably clears the
// measured floor. This is the provider-side generation cap SPEC.md D5
// means by "the runner caps generation at the band ceiling" — the only
// lever the CLI exposes is dollar budget, not a token count.
const BAND_BUDGET_MULTIPLIER = 5;
const MIN_JOB_BUDGET_USD = 0.15;

function jobBudgetUsd(band: Band): number {
  return Math.max(MIN_JOB_BUDGET_USD, (Number(band.priceMicros) / 1_000_000) * BAND_BUDGET_MULTIPLIER);
}
const HOUSE_PROVIDER_ID = "house";

/**
 * Splits "claude-code/sonnet" or "claude-code-tools/sonnet" into the
 * adapter (used as the dispatch/capacity lookup key, so Tier 0 and Tier 1
 * nodes serving the same underlying model name never collide in the
 * registry) and the bare claude alias (the only thing the CLI's --model
 * flag understands).
 */
function parseModelId(model: string): { qualifiedModel: string; bareModel: string } {
  const match = /^(claude-code|claude-code-tools)\/(sonnet|opus|haiku)$/.exec(model);
  if (!match) throw new PricingError(`unknown model ${model}`, 400);
  return { qualifiedModel: model, bareModel: match[2] };
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

/** Shared simulate -> broadcast -> poll settlement, used by both the
 * per-job x402 path and prepaid-key top-ups (SPEC.md §6). */
async function settleX402Payment(
  keeperhub: KeeperHubClient,
  chainProfile: ChainProfile,
  payment: X402Payment,
): Promise<{ ok: true; transactionHash?: string } | { ok: false; reason: string }> {
  const call = buildSettlementCall(payment.auth, payment.signature, chainProfile.usdcAddress, chainProfile.chainId);
  const sim = await keeperhub.simulateContractCall(call);
  if (sim.wouldRevert) {
    return { ok: false, reason: `settlement would revert: ${sim.revertReason}` };
  }
  const broadcast = await keeperhub.contractCall(call, payment.auth.nonce);
  if ("kind" in broadcast) {
    return { ok: false, reason: `settlement ${broadcast.kind}` };
  }
  const final = await keeperhub.pollToTerminal(broadcast.executionId);
  if (final.status !== "completed" || !final.receipts.every((r) => r.verified)) {
    return { ok: false, reason: "settlement failed to verify" };
  }
  return { ok: true, transactionHash: final.transactionHash };
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
  registry: NodeRegistry;
}

export function buildServer(deps: ServerDeps): Hono {
  const { env, chainProfile, db, keeperhub, houseNodeKeypair, credentialsPath, registry } = deps;
  const app = new Hono();

  ensureHouseProvider(db);

  // Wildcard for now (confirmed choice — docs/superpowers/specs/2026-08-11-
  // nextjs-dashboard-design.md): the UI is hosted separately from this
  // process, so the router needs to accept requests from wherever it ends
  // up deployed. Tighten to a specific CORS_ORIGIN later if needed.
  app.use("/api/*", cors());
  app.use("/v1/*", cors());

  // --- Per-consumer rate limiting (PLAN.md 1.3, disclosed as "Partial" in
  // SPEC.md §7). Fixed window in memory — fine for a single-process
  // monolith, resets on restart. Keyed by payer address (x402) or key hash
  // (prepaid), so one abusive consumer can't flood a node or burn through
  // KeeperHub's 60/min settlement rate limit (SPEC.md §6) on its own.
  // Per-node throttling lives in dispatch.ts, next to the rest of a node's
  // live state. ---
  const CONSUMER_LIMIT = 20; // requests per window
  const RATE_WINDOW_MS = 60_000;
  const consumerWindows = new Map<string, { count: number; resetAt: number }>();

  function checkConsumerRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = consumerWindows.get(key);
    if (!entry || entry.resetAt < now) {
      consumerWindows.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return true;
    }
    if (entry.count >= CONSUMER_LIMIT) return false;
    entry.count++;
    return true;
  }

  app.get("/v1/models", (c) => {
    const remoteModels = new Set<string>();
    for (const node of registry.list()) for (const m of node.models) remoteModels.add(`${node.adapter}/${m}`);
    const data = [...new Set([...HOUSE_MODELS, ...remoteModels])].map((id) => ({ id, object: "model" }));
    return c.json({ object: "list", data });
  });

  app.post("/v1/messages", async (c) => {
    let body: { model: string; max_tokens: number; messages: AnthropicMessage[]; stream?: boolean };
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

    let qualifiedModel: string;
    let bareModel: string;
    try {
      ({ qualifiedModel, bareModel } = parseModelId(body.model));
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
      if (!checkConsumerRateLimit(keyHash)) {
        return c.json({ error: { type: "rate_limited", message: `at most ${CONSUMER_LIMIT} requests/min per key` } }, 429);
      }
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
      if (!checkConsumerRateLimit(decoded.auth.from)) {
        return c.json({ error: { type: "rate_limited", message: `at most ${CONSUMER_LIMIT} requests/min per payer` } }, 429);
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

    // --- Dispatch: remote node first (dispatch.ts, one retry, ranked by headroom),
    // house Tier-0 in-process as fallback (SPEC.md §5, §6 "house-node fallback") ---
    const jobId = newJobId();
    const remote = await registry.dispatch(qualifiedModel, { jobId, prompt: promptText, model: bareModel, maxBudgetUsd: jobBudgetUsd(band) });

    let result: {
      ok: boolean;
      text?: string;
      modelReported?: string;
      costUsd?: number;
      inputTokens?: number;
      outputTokens?: number;
      error?: string;
    };
    let servingProviderId: string;
    let remoteAttestation: string | undefined;
    let remoteNode: ConnectedNode | undefined;

    if (remote) {
      result = remote.result;
      servingProviderId = remote.node.providerId;
      remoteAttestation = remote.result.attestation;
      remoteNode = remote.node;
    } else if (qualifiedModel.startsWith("claude-code-tools/")) {
      // The house fallback is Tier 0 only — silently downgrading a Tier 1
      // (tool-enabled) request to tool-free would hand back a capability
      // the consumer didn't ask for and didn't get. Fail instead.
      result = { ok: false, error: "no Tier 1 (tool-enabled) node currently online" };
      servingProviderId = HOUSE_PROVIDER_ID;
    } else {
      result = await runTier0({
        jobId,
        prompt: promptText,
        model: bareModel,
        maxBudgetUsd: jobBudgetUsd(band),
        credentialsPath,
        timeoutMs: 90_000,
      });
      servingProviderId = HOUSE_PROVIDER_ID;
    }

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
      const settled = await settleX402Payment(keeperhub, chainProfile, payment);
      if (!settled.ok) {
        releaseNonce(db, payment.auth.nonce);
        return c.json({ error: { type: "api_error", message: settled.reason } }, 502);
      }
      settlementTx = settled.transactionHash;
      db.prepare(
        `INSERT INTO payments_in (id, kind, amount_micros, payer, nonce, settlement_tx, settlement_status, created_at)
         VALUES (?, 'x402', ?, ?, ?, ?, 'settled', ?)`,
      ).run(jobId, band.priceMicros.toString(), payment.auth.from, payment.auth.nonce, settlementTx, Date.now());
    }

    // --- Attest + credit + record ---
    const attestationInput: AttestationInput = {
      requestId: jobId,
      adapter: remoteNode?.adapter ?? "claude-code", // must match what the node itself signed
      modelReported: result.modelReported ?? bareModel,
      promptHash: sha256Hex(promptText),
      outputHash: sha256Hex(result.text ?? ""),
      inputTokens: result.inputTokens ?? 0,
      outputTokens: result.outputTokens ?? 0,
      costUsdMicros: BigInt(Math.round((result.costUsd ?? 0) * 1_000_000)),
    };

    let attestation: string;
    if (remoteNode && remoteAttestation) {
      // Remote node already signed with its own key — verify against its
      // registered pubkey (SPEC.md §7: deterrent, not proof) and log rather
      // than reject on mismatch, since the completion has already happened.
      const valid = registry.verifyJobAttestation(remoteNode.nodeId, attestationInput, remoteAttestation);
      if (!valid) {
        db.prepare(`INSERT INTO events (kind, payload, created_at) VALUES ('attestation_mismatch', ?, ?)`).run(
          JSON.stringify({ jobId, nodeId: remoteNode.nodeId }),
          Date.now(),
        );
      }

      // Cost-plausibility cross-check (SPEC.md §7: "an 'Opus' job reporting
      // $0.0001 is flagged"). A deterrent, like the attestation itself — an
      // opus-claiming job costing less than the measured ~$0.05 sonnet
      // preamble floor (SPEC.md §1 V2) is implausible regardless of prompt
      // size, since the floor is dominated by the fixed system-prompt
      // preamble, not the model.
      const claimedOpus = /opus/i.test(attestationInput.modelReported);
      const costUsd = Number(attestationInput.costUsdMicros) / 1_000_000;
      if (claimedOpus && costUsd < 0.01) {
        db.prepare(`INSERT INTO events (kind, payload, created_at) VALUES ('cost_implausible', ?, ?)`).run(
          JSON.stringify({ jobId, nodeId: remoteNode.nodeId, modelReported: attestationInput.modelReported, costUsd }),
          Date.now(),
        );
      }

      attestation = remoteAttestation;
    } else {
      attestation = signAttestation(attestationInput, houseNodeKeypair.privateKeyDer);
    }

    creditProvider(db, servingProviderId, band);
    db.prepare(
      `INSERT INTO jobs (id, node_id, payment_id, model, band, status, cost_usd_micros, input_tokens, output_tokens, attestation, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)`,
    ).run(
      jobId,
      remoteNode?.nodeId ?? null,
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
    c.header("x-idleproxy-node", servingProviderId);
    if (settlementTx) c.header("x-idleproxy-settlement-tx", settlementTx);

    const usage = { input_tokens: result.inputTokens ?? 0, output_tokens: result.outputTokens ?? 0 };

    if (!body.stream) {
      return c.json({
        id: `msg_${jobId}`,
        type: "message",
        role: "assistant",
        model: body.model,
        content: [{ type: "text", text: result.text }],
        stop_reason: "end_turn",
        usage,
      });
    }

    // Settlement is already complete above — the SSE stream only starts
    // once money has moved, matching the non-streaming path's guarantee
    // (SPEC.md §6: settle precedes respond). This is NOT token-by-token
    // generation streaming: the underlying CLI (`--output-format json`)
    // returns one complete result at the end of the run, not incremental
    // deltas, so what's chunked here is the already-final text. The
    // framing is genuine Anthropic Messages SSE — a real streaming client
    // parses it correctly — but the latency profile is "wait, then
    // stream," not "stream as it's generated."
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ event: "message_start", data: JSON.stringify({ type: "message_start", message: { id: `msg_${jobId}`, type: "message", role: "assistant", model: body.model, content: [], stop_reason: null, usage: { input_tokens: usage.input_tokens, output_tokens: 0 } } }) });
      await stream.writeSSE({ event: "content_block_start", data: JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }) });

      const text = result.text ?? "";
      const chunkSize = 24;
      for (let i = 0; i < text.length; i += chunkSize) {
        await stream.writeSSE({
          event: "content_block_delta",
          data: JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: text.slice(i, i + chunkSize) } }),
        });
      }

      await stream.writeSSE({ event: "content_block_stop", data: JSON.stringify({ type: "content_block_stop", index: 0 }) });
      await stream.writeSSE({
        event: "message_delta",
        data: JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: usage.output_tokens } }),
      });
      await stream.writeSSE({ event: "message_stop", data: JSON.stringify({ type: "message_stop" }) });
    });
  });

  // --- Prepaid keys (SPEC.md D9) — x402 payment mints an ipx_sk_ key with
  // full credit; subsequent /v1/messages calls debit it locally and never
  // see a 402. This is the path where "change one env var and your
  // existing SDK works" is literally true. ---
  const MIN_TOPUP_MICROS = BANDS[0].priceMicros;
  const MAX_TOPUP_MICROS = 10_000_000n; // 10 USDC ceiling, sane for a demo

  app.post("/api/keys", async (c) => {
    const paymentHeader = c.req.header("x-payment");
    if (!paymentHeader) {
      return c.json(
        {
          error: { type: "payment_required", message: "pay via X-PAYMENT to mint a prepaid key" },
          accepts: [
            {
              scheme: "exact",
              network: "base-sepolia",
              asset: chainProfile.usdcAddress,
              minAmountRequired: MIN_TOPUP_MICROS.toString(),
              maxAmountRequired: MAX_TOPUP_MICROS.toString(),
              payTo: env.PAY_TO_ADDRESS,
            },
          ],
        },
        402,
      );
    }

    const decoded = decodePaymentHeader(paymentHeader);
    if (!decoded) return c.json({ error: { type: "payment_required", message: "malformed X-PAYMENT header" } }, 402);
    if (decoded.auth.value > MAX_TOPUP_MICROS) {
      return c.json({ error: { type: "invalid_request_error", message: `top-up exceeds ${MAX_TOPUP_MICROS} micros` } }, 400);
    }

    const verified = await verifyPayment(decoded.auth, decoded.signature, chainProfile.eip712Domain, {
      payTo: getAddress(env.PAY_TO_ADDRESS),
      minValue: MIN_TOPUP_MICROS,
    });
    if (!verified.ok) return c.json({ error: { type: "payment_required", message: verified.reason } }, 402);
    if (!nonceUnused(db, decoded.auth.nonce)) {
      return c.json({ error: { type: "payment_required", message: "nonce already used (replay)" } }, 402);
    }

    const settled = await settleX402Payment(keeperhub, chainProfile, decoded);
    if (!settled.ok) {
      releaseNonce(db, decoded.auth.nonce);
      return c.json({ error: { type: "api_error", message: settled.reason } }, 502);
    }

    const topupId = newJobId();
    db.prepare(
      `INSERT INTO payments_in (id, kind, amount_micros, payer, nonce, settlement_tx, settlement_status, created_at)
       VALUES (?, 'prepaid_topup', ?, ?, ?, ?, 'settled', ?)`,
    ).run(topupId, decoded.auth.value.toString(), decoded.auth.from, decoded.auth.nonce, settled.transactionHash, Date.now());

    const apiKey = `ipx_sk_${randomBytes(24).toString("hex")}`;
    const keyHash = sha256Hex(apiKey);
    db.prepare(`INSERT INTO consumer_keys (key_hash, balance_micros, created_at) VALUES (?, ?, ?)`).run(
      keyHash,
      decoded.auth.value.toString(),
      Date.now(),
    );

    // Shown once — only the hash is ever stored.
    return c.json({ api_key: apiKey, balance_micros: decoded.auth.value.toString(), settlement_tx: settled.transactionHash });
  });

  app.get("/api/keys/balance", async (c) => {
    const apiKey = c.req.header("x-api-key");
    if (!apiKey?.startsWith("ipx_sk_")) return c.json({ error: { type: "invalid_request_error", message: "missing x-api-key" } }, 400);
    const row = db.prepare(`SELECT balance_micros AS balance FROM consumer_keys WHERE key_hash = ?`).get(sha256Hex(apiKey)) as
      | { balance: string }
      | undefined;
    if (!row) return c.json({ error: { type: "not_found_error", message: "unknown key" } }, 404);
    return c.json({ balance_micros: row.balance });
  });

  // --- Provider onboarding: SIWE-lite wallet auth, disclosure gate, caps
  // + node-token issuance (SPEC.md §8: "No node token is issued without
  // it [disclosure accept]"). Sessions and nonces are in-memory — fine for
  // a single-process monolith; they don't need to survive a restart. ---
  const siweNonces = new Map<string, number>(); // nonce -> expiresAt
  const sessions = new Map<string, { wallet: string; expiresAt: number }>(); // session token -> wallet

  const DISCLOSURE_TEXT = [
    "You are offering your own paid subscription to anonymous third parties for payment. We copy your credential into a throwaway home directory and start the program you installed; the token is never read, parsed, or transmitted. The requests it answers are billed to your subscription and count against your limits.",
    "This may violate your provider's Terms of Service. Anthropic's terms restrict reselling or sharing subscription capacity. Your account is at risk of suspension, with no recourse from us. Do not connect an account you cannot afford to lose.",
    "Consumers send prompts you cannot see in advance and cannot control.",
    "Default execution is tool-free. Tool-enabled execution is a separate opt-in and runs in an isolated container; isolation is strong, not perfect.",
    "You set hard caps and a reserve. Enforcement is best-effort, from figures the CLI self-reports — a strong bound, not a guarantee. Kill switch at any time.",
    "This is testnet. Payouts are Base Sepolia test-USDC with no monetary value.",
    "This version is custodial. Payouts are executed via KeeperHub and independently verifiable onchain.",
  ];

  function newSession(wallet: string): string {
    const token = randomBytes(24).toString("hex");
    sessions.set(token, { wallet, expiresAt: Date.now() + 60 * 60 * 1000 });
    return token;
  }

  function requireSession(c: Parameters<Parameters<Hono["use"]>[1]>[0]): { wallet: string } | null {
    const auth = c.req.header("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!token) return null;
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) return null;
    return { wallet: session.wallet };
  }

  // --- MCP (SPEC.md §10): one tool, relay_prompt, over streamable HTTP.
  // Stateless JSON-RPC — no session store, since every tool call is
  // self-contained. A 402 from the inner call surfaces as an MCP tool
  // error carrying the x402 challenge in its text, matching how
  // KeeperHub's own paid marketplace listings report a 402 (this MCP
  // transport does not auto-pay any more than theirs does). ---
  const RELAY_PROMPT_TOOL = {
    name: "relay_prompt",
    description: "Relay a single prompt to a coding-agent model through IdleProxy and pay for it.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: 'e.g. "claude-code/sonnet"' },
        prompt: { type: "string" },
        max_tokens: { type: "number", default: 256 },
        api_key: { type: "string", description: "Optional ipx_sk_ prepaid key. Omit to receive a 402 x402 challenge instead." },
      },
      required: ["model", "prompt"],
    },
  };

  app.post("/mcp", async (c) => {
    const msg = await c.req.json<{ jsonrpc: string; id?: number | string; method: string; params?: any }>().catch(() => null);
    if (!msg) return c.json({ jsonrpc: "2.0", error: { code: -32700, message: "parse error" } }, 400);

    if (msg.method === "notifications/initialized") {
      return c.body(null, 202);
    }

    if (msg.method === "initialize") {
      return c.json({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "idleproxy", version: "0.1.0" },
        },
      });
    }

    if (msg.method === "tools/list") {
      return c.json({ jsonrpc: "2.0", id: msg.id, result: { tools: [RELAY_PROMPT_TOOL] } });
    }

    if (msg.method === "tools/call") {
      const { name, arguments: args } = msg.params ?? {};
      if (name !== "relay_prompt") {
        return c.json({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: `unknown tool ${name}` }], isError: true } });
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (args.api_key) headers["x-api-key"] = args.api_key;

      const innerRes = await app.fetch(
        new Request("http://internal/v1/messages", {
          method: "POST",
          headers,
          body: JSON.stringify({ model: args.model, max_tokens: args.max_tokens ?? 256, messages: [{ role: "user", content: args.prompt }] }),
        }),
      );
      const innerBody = (await innerRes.json()) as any;

      if (!innerRes.ok) {
        return c.json({
          jsonrpc: "2.0",
          id: msg.id,
          result: { content: [{ type: "text", text: JSON.stringify(innerBody) }], isError: true },
        });
      }

      const text = innerBody.content?.[0]?.text ?? "";
      return c.json({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text }], isError: false } });
    }

    return c.json({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `method not found: ${msg.method}` } }, 404);
  });

  // --- OpenAI-compatible surface (SPEC.md §10) — a thin shape translator
  // over /v1/messages, not a second settlement/dispatch implementation.
  // Re-invoking app.fetch() means every fix made to the Anthropic path
  // (pricing, x402, attestation, dispatch) applies here automatically. ---
  app.post("/v1/chat/completions", async (c) => {
    let body: { model: string; max_tokens?: number; max_completion_tokens?: number; messages: AnthropicMessage[] };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "invalid JSON body", type: "invalid_request_error" } }, 400);
    }

    const anthropicBody = {
      model: body.model,
      max_tokens: body.max_tokens ?? body.max_completion_tokens ?? 256,
      messages: body.messages,
    };

    const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const paymentHeader = c.req.header("x-payment");
    const apiKeyHeader = c.req.header("x-api-key");
    if (paymentHeader) forwardHeaders["x-payment"] = paymentHeader;
    if (apiKeyHeader) forwardHeaders["x-api-key"] = apiKeyHeader;

    const innerRes = await app.fetch(
      new Request("http://internal/v1/messages", { method: "POST", headers: forwardHeaders, body: JSON.stringify(anthropicBody) }),
    );
    const innerBody = (await innerRes.json()) as any;

    if (!innerRes.ok) {
      // Forward `accepts` too on a 402 — it's the x402 challenge itself, not
      // OpenAI error-shape decoration, and a client needs it to pay.
      return c.json(
        { error: { message: innerBody.error?.message ?? "request failed", type: innerBody.error?.type ?? "api_error" }, accepts: innerBody.accepts },
        innerRes.status as 400,
      );
    }

    for (const header of ["x-idleproxy-attestation", "x-idleproxy-node", "x-idleproxy-settlement-tx"]) {
      const value = innerRes.headers.get(header);
      if (value) c.header(header, value);
    }

    const text = innerBody.content?.[0]?.text ?? "";
    const promptTokens = innerBody.usage?.input_tokens ?? 0;
    const completionTokens = innerBody.usage?.output_tokens ?? 0;

    return c.json({
      id: innerBody.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
    });
  });

  app.get("/api/provider/disclosure", (c) => c.json({ version: 1, points: DISCLOSURE_TEXT }));

  app.get("/api/siwe/nonce", (c) => {
    const nonce = randomBytes(16).toString("hex");
    siweNonces.set(nonce, Date.now() + 5 * 60 * 1000);
    return c.json({ nonce, message: `Sign this nonce to connect to IdleProxy: ${nonce}` });
  });

  app.post("/api/siwe/verify", async (c) => {
    const body = await c.req.json<{ address: string; nonce: string; signature: Hex }>().catch(() => null);
    if (!body) return c.json({ error: { type: "invalid_request_error", message: "invalid JSON body" } }, 400);

    const expiresAt = siweNonces.get(body.nonce);
    if (!expiresAt || expiresAt < Date.now()) {
      return c.json({ error: { type: "invalid_request_error", message: "unknown or expired nonce" } }, 400);
    }
    siweNonces.delete(body.nonce); // single use

    const address = getAddress(body.address);
    const valid = await verifyMessage({
      address,
      message: `Sign this nonce to connect to IdleProxy: ${body.nonce}`,
      signature: body.signature,
    });
    if (!valid) return c.json({ error: { type: "invalid_request_error", message: "signature invalid" } }, 400);

    const session = newSession(address);
    return c.json({ session, wallet: address });
  });

  app.post("/api/provider/accept-disclosure", async (c) => {
    const auth = requireSession(c);
    if (!auth) return c.json({ error: { type: "unauthorized", message: "sign in first" } }, 401);
    const body = await c.req.json<{ tier1Accepted?: boolean }>().catch(() => ({}) as { tier1Accepted?: boolean });

    const providerId = upsertProviderByWallet(db, auth.wallet);
    const now = Date.now();
    db.prepare(`UPDATE providers SET disclosure_accepted_at = ?, tier1_accepted_at = ? WHERE id = ?`).run(
      now,
      body.tier1Accepted ? now : null,
      providerId,
    );
    return c.json({ ok: true, disclosureAcceptedAt: now, tier1Accepted: !!body.tier1Accepted });
  });

  app.post("/api/provider/node-token", async (c) => {
    const auth = requireSession(c);
    if (!auth) return c.json({ error: { type: "unauthorized", message: "sign in first" } }, 401);

    const providerId = upsertProviderByWallet(db, auth.wallet);
    const row = db.prepare(`SELECT disclosure_accepted_at AS acceptedAt FROM providers WHERE id = ?`).get(providerId) as
      | { acceptedAt: number | null }
      | undefined;
    if (!row?.acceptedAt) {
      return c.json({ error: { type: "invalid_request_error", message: "accept the disclosure first" } }, 400);
    }

    const body = await c.req
      .json<{ dailyUsdCap?: number; dailyRequestCap?: number; maxConcurrency?: number; reserveFraction?: number }>()
      .catch(() => ({}) as Record<string, never>);
    const dailyUsdCap = body.dailyUsdCap ?? 5;
    const dailyRequestCap = body.dailyRequestCap ?? 500;
    const maxConcurrency = body.maxConcurrency ?? 1;
    const reserveFraction = body.reserveFraction ?? 0.2;

    const nodeToken = randomBytes(24).toString("hex");
    db.prepare(`UPDATE providers SET node_token = ? WHERE id = ?`).run(nodeToken, providerId);

    // The provider runs this command on their own machine, which is never
    // the router's machine once the router is hosted remotely -- without
    // pointing --router-ws-url at this router explicitly, cmdNode falls
    // back to its ws://localhost:8787/node default and every remote
    // provider's node fails to connect.
    const routerWsUrl = env.BASE_URL.replace(/^http/, "ws") + "/node";
    const command =
      `npx idleproxy node --wallet=${auth.wallet} --token=${nodeToken} ` +
      `--router-ws-url=${routerWsUrl} ` +
      `--daily-usd-cap=${dailyUsdCap} --daily-request-cap=${dailyRequestCap} ` +
      `--max-concurrency=${maxConcurrency} --reserve-fraction=${reserveFraction}`;

    return c.json({ nodeToken, command });
  });

  app.get("/api/provider/me", (c) => {
    const auth = requireSession(c);
    if (!auth) return c.json({ error: { type: "unauthorized", message: "sign in first" } }, 401);

    const providerId = upsertProviderByWallet(db, auth.wallet);
    const provider = db.prepare(`SELECT * FROM providers WHERE id = ?`).get(providerId);
    const balance = db.prepare(`SELECT * FROM provider_balances WHERE provider_id = ?`).get(providerId);
    const nodes = db.prepare(`SELECT id, adapter, status, last_heartbeat_at FROM nodes WHERE provider_id = ?`).all(providerId);
    const jobs = db
      .prepare(`SELECT id, model, band, status, cost_usd_micros, created_at FROM jobs WHERE node_id IN (SELECT id FROM nodes WHERE provider_id = ?) ORDER BY created_at DESC LIMIT 20`)
      .all(providerId);
    const payouts = db.prepare(`SELECT * FROM payouts WHERE provider_id = ? ORDER BY created_at DESC LIMIT 20`).all(providerId);

    return c.json({ provider, balance, nodes, jobs, payouts });
  });

  app.post("/api/provider/kill-switch", async (c) => {
    const auth = requireSession(c);
    if (!auth) return c.json({ error: { type: "unauthorized", message: "sign in first" } }, 401);
    const body = await c.req.json<{ enabled: boolean }>().catch(() => ({ enabled: true }));

    const providerId = upsertProviderByWallet(db, auth.wallet);
    db.prepare(`UPDATE providers SET kill_switch = ? WHERE id = ?`).run(body.enabled ? 1 : 0, providerId);
    if (body.enabled) {
      for (const node of registry.list().filter((n) => n.providerId === providerId)) {
        node.ws.close();
      }
    }
    return c.json({ ok: true, killSwitch: !!body.enabled });
  });

  // --- Settlement hook (SPEC.md §10): the KeeperHub Schedule workflow
  // calls this, HMAC-authed. Thresholding happens in here, not in a
  // downstream Condition node — the Webhook plugin's "Send Webhook" action
  // only exposes success/error, with no response body for a Condition to
  // read (PLAN.md 2.2). Same batch logic as `idleproxy treasurer`, shared
  // via treasurer.ts's runPayoutBatch. ---
  const SETTLEMENT_THRESHOLD_MICROS = 1_000_000n; // $1.00, SPEC.md §6

  app.post("/internal/settlement/run", async (c) => {
    const rawBody = await c.req.text();

    // Two auth modes, both timing-safe: an HMAC-SHA256 over the body (for
    // programmatic callers that can compute one, e.g. idleproxy's own CLI),
    // or a static shared-secret header (for the KeeperHub "HTTP Request"
    // action, which can set a custom header but has no way to compute an
    // HMAC — running arbitrary JS to do so needs the Code action, which is
    // a paid-plan feature unavailable on this org's tier). Neither mode is
    // weaker than the other in the threat model that matters here: the
    // secret is never in the URL or logged, and a leaked static token is no
    // more exposed than a leaked HMAC key would be.
    const signature = c.req.header("x-settlement-signature");
    const staticToken = c.req.header("x-settlement-token");

    let authorized = false;
    if (signature) {
      const expected = createHmac("sha256", env.SETTLEMENT_HMAC_SECRET).update(rawBody).digest("hex");
      const sigBuf = Buffer.from(signature, "hex");
      const expectedBuf = Buffer.from(expected, "hex");
      authorized = sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    } else if (staticToken) {
      const tokenBuf = Buffer.from(staticToken, "utf8");
      const secretBuf = Buffer.from(env.SETTLEMENT_HMAC_SECRET, "utf8");
      authorized = tokenBuf.length === secretBuf.length && timingSafeEqual(tokenBuf, secretBuf);
    }
    if (!authorized) {
      return c.json({ error: { type: "unauthorized", message: "invalid or missing signature/token" } }, 401);
    }

    const result = await runPayoutBatch(env, chainProfile, db, SETTLEMENT_THRESHOLD_MICROS);
    db.prepare(`INSERT INTO events (kind, payload, created_at) VALUES ('settlement_run', ?, ?)`).run(JSON.stringify(result), Date.now());
    return c.json(result);
  });

  // --- Audit (SPEC.md §10): mirrors recent activity for the provider
  // dashboard and for anyone verifying the rail independently. ---
  app.get("/api/audit", async (c) => {
    const events = db.prepare(`SELECT id, kind, payload, created_at FROM events ORDER BY id DESC LIMIT 50`).all();
    const recentJobs = db.prepare(`SELECT id, model, band, status, cost_usd_micros, created_at FROM jobs ORDER BY created_at DESC LIMIT 50`).all();
    const recentPayouts = db.prepare(`SELECT id, provider_id, amount_micros, status, transaction_link, created_at FROM payouts ORDER BY created_at DESC LIMIT 50`).all();

    // The Solvency Watchdog workflow's Condition result IS the
    // reconciliation alert on this org's plan tier — the Send Webhook and
    // Code actions that would otherwise push a notification are gated
    // behind a paid plan (confirmed live: both return upgrade_required).
    // KeeperHub's own Executions API is the alert surface instead.
    let solvencyWatchdog: any[] = [];
    if (env.KEEPERHUB_RECONCILIATION_WORKFLOW_ID) {
      const runs = await keeperhub.listWorkflowExecutions(env.KEEPERHUB_RECONCILIATION_WORKFLOW_ID, 10);
      solvencyWatchdog = runs.map((r) => ({
        executionId: r.id,
        status: r.status,
        belowSafetyFloor: r.output?.condition ?? null,
        startedAt: r.startedAt,
      }));
    }

    return c.json({ events, jobs: recentJobs, payouts: recentPayouts, solvencyWatchdog });
  });

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

/** Upserts a provider by wallet and registers a node row, so a WS `hello`
 * from an unrecognized wallet just works — SIWE-gated onboarding (issuing a
 * scoped node token ahead of time) is the UI's job, not dispatch's; see
 * PLAN.md Phase 3 / public/ UI task. */
function upsertProviderByWallet(db: Database.Database, wallet: string): string {
  const existing = db.prepare(`SELECT id FROM providers WHERE wallet = ?`).get(wallet) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = `p_${wallet.slice(2, 10).toLowerCase()}`;
  db.prepare(`INSERT INTO providers (id, wallet, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING`).run(id, wallet, Date.now());
  return id;
}

export function attachNodeServer(httpServer: import("node:http").Server, registry: NodeRegistry, db: Database.Database): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url !== "/node") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket) => {
    let nodeId: string | null = null;

    ws.on("message", (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "hello") {
        const providerId = upsertProviderByWallet(db, msg.wallet);
        const provider = db
          .prepare(`SELECT node_token AS nodeToken, disclosure_accepted_at AS acceptedAt, tier1_accepted_at AS tier1AcceptedAt, kill_switch AS killSwitch FROM providers WHERE id = ?`)
          .get(providerId) as { nodeToken: string | null; acceptedAt: number | null; tier1AcceptedAt: number | null; killSwitch: number } | undefined;

        // SPEC.md §8: "No node token is issued without it [disclosure
        // accept]" — enforced here, not just at issuance time, so a stale
        // or forged token can't bypass the onboarding gate.
        if (!provider?.acceptedAt || !provider.nodeToken || provider.nodeToken !== msg.token) {
          ws.send(JSON.stringify({ type: "error", message: "not onboarded: accept the disclosure and request a node token first" }));
          ws.close();
          return;
        }
        if (provider.killSwitch) {
          ws.send(JSON.stringify({ type: "error", message: "kill switch is engaged for this provider" }));
          ws.close();
          return;
        }
        if (msg.adapter === "claude-code-tools" && !provider.tier1AcceptedAt) {
          ws.send(JSON.stringify({ type: "error", message: "Tier 1 requires its own disclosure opt-in" }));
          ws.close();
          return;
        }

        nodeId = `n_${msg.pubkey.slice(0, 16)}`;
        // Kept bare ("sonnet", not "claude-code/sonnet") — matches the
        // claude --model flag and the heartbeat's capacity keys, which the
        // node also sends bare. Only /v1/models prefixes for presentation.
        registry.register({
          nodeId,
          providerId,
          wallet: msg.wallet,
          adapter: msg.adapter,
          models: msg.models,
          pubkey: msg.pubkey,
          ws,
          capacity: new Map(),
          lastHeartbeatAt: Date.now(),
        });
        ws.send(JSON.stringify({ type: "hello_ack", nodeId }));
        return;
      }

      if (msg.type === "heartbeat" && nodeId) {
        registry.updateCapacity(nodeId, msg.capacity);
        return;
      }

      if (msg.type === "job_result") {
        registry.resolveJobResult(msg);
        return;
      }
    });

    ws.on("close", () => registry.handleDisconnect(ws));
  });
}

export function startServer(app: Hono, port: number): import("node:http").Server {
  return serve({ fetch: app.fetch, port }, (info) => {
    console.log(`idleproxy router listening on :${info.port}`);
  }) as import("node:http").Server;
}
