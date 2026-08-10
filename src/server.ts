import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getAddress, type Address, type Hex } from "viem";
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
import { randomBytes } from "node:crypto";

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

  app.get("/v1/models", (c) => {
    const remoteModels = new Set<string>();
    for (const node of registry.list()) for (const m of node.models) remoteModels.add(`${node.adapter}/${m}`);
    const data = [...new Set([...HOUSE_MODELS, ...remoteModels])].map((id) => ({ id, object: "model" }));
    return c.json({ object: "list", data });
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

    // --- Dispatch: remote node first (dispatch.ts, one retry, ranked by headroom),
    // house Tier-0 in-process as fallback (SPEC.md §5, §6 "house-node fallback") ---
    const jobId = newJobId();
    const remote = await registry.dispatch(claudeModel, { jobId, prompt: promptText, model: claudeModel, maxBudgetUsd: MAX_JOB_BUDGET_USD });

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
    } else {
      result = await runTier0({
        jobId,
        prompt: promptText,
        model: claudeModel,
        maxBudgetUsd: MAX_JOB_BUDGET_USD,
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
      adapter: "claude-code",
      modelReported: result.modelReported ?? claudeModel,
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
