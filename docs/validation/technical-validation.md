# Technical validation report

> ⚠️ **Superseded pass.** This is the *first* review, run before the constraints changed (provider
> backend became the user's own local coding-agent CLI; budget went to zero; the consumer surface
> became Anthropic-compatible). Its ToS analysis and x402 mechanics still hold; its open-weight
> recommendation, canary-verification design, and mainnet assumptions do **not**. Current decisions
> live in [`../../SPEC.md`](../../SPEC.md) v2.0. Kept for the sourced ToS citations and the
> reasoning trail.

Adversarial technical review of the DeClaude idea. Produced 2026-08-09 by an independent validation
agent (Fable 5). Preserved near-verbatim.

## Verdict

Build a modified version. The idea as pitched — pooling and reselling Claude Code / Pro-Max / Codex
*subscription* capacity — is dead on arrival: it violates the letter of both Anthropic's and OpenAI's
terms, both companies actively enforce it (Anthropic began blocking accounts used through
third-party harnesses in January 2026), and the marketplace would be built on supply that can be
banned mid-demo. But the *shape* of the product — an npm package that turns idle machines into
x402-paid inference endpoints, with KeeperHub as the settlement/payout rail — survives cleanly if the
default supply is open-weight models (ollama: Llama, Qwen, gpt-oss) and the frontier-model story is
reframed as "agent-task-as-a-service" run on the provider's own account, never raw token passthrough.
The KeeperHub fit is genuinely authentic, and a real, honest, end-to-end demo with a mainnet
transaction link is achievable in 4 days if scope is cut aggressively.

## Blocking risks

| Risk | Severity | Mitigation | In scope for 4 days? |
|---|---|---|---|
| Subscription-capacity resale violates Anthropic Consumer Terms §2/§3 and OpenAI ToU; accounts get banned | Fatal | Remove from design entirely; open-weight default tier | Yes (a scope cut) |
| Even PAYG-API-key passthrough is likely "resale" under Anthropic Commercial Terms §D.4 (2026 wrapper crackdown) | High | No raw Claude/GPT proxying at all; optional "agent task" tier only, clearly the provider's own product | Yes (scope cut + disclosure) |
| Provider returns cheap-model output claiming a better model | High | Signed attestations + canary sampling + reputation; full verification (TEE/stake) out of scope | Partially — attest + disclose |
| Prompt confidentiality (provider reads consumer prompts) | High | Disclose loudly; provider pinning; TEEs later | No — disclose only |
| KeeperHub agentic wallet cannot pay on Base Sepolia (chain allowlist is 8453/4217/42431) | High for demo | Run consumer payments on Base **mainnet** USDC at $0.01–0.05/call | Yes |
| Long generations vs HTTP timeouts / x402 `maxTimeoutSeconds` | Medium | Cap `max_tokens` per price band; small models for the demo | Yes |
| Payment replay (same `X-PAYMENT` reused) | Medium | Dedupe the EIP-3009 nonce in the broker DB before serving; settle before responding | Yes |
| Provider node dies mid-generation after payment verified | Medium | Retry on a second node; if none, never settle (consumer pays nothing) | Yes |
| Broker is fully trusted (custodies flow of funds and the ledger) | Medium | Honest disclosure: custodial v1; KeeperHub receipts make payouts auditable | Yes (disclosure) |
| Sybil providers / self-dealing | Low | No emissions or subsidies → self-dealing burns the platform fee; nothing to farm | Yes (by construction) |

## ToS analysis and recommended variant

**The blocker, quoted.**

- Anthropic **Consumer Terms** (Claude Free/Pro/Max, and Claude Code under a subscription), §2:
  *"You may not share your Account login information, Anthropic API key, or Account credentials with
  anyone else"* and *"You also may not make your Account available to anyone else."* §3 prohibits use
  *"to … resell the Services"* and restricts *"access … through automated or non-human means"* except
  via API key or explicit permission — https://www.anthropic.com/legal/consumer-terms
- Anthropic's Feb-2026 clarification: *"Using OAuth tokens obtained through Claude Free, Pro, or Max
  accounts in any other product, tool, or service — including the Agent SDK — is not permitted."*
  Subscription OAuth tokens are valid only inside Claude Code and Claude.ai; enforcement (account
  blocking) began January 2026 —
  https://www.theregister.com/software/2026/02/20/anthropic-clarifies-ban-on-third-party-tool-access-to-claude/5014546
- Anthropic **Commercial Terms** (API), §D.4 Use Restrictions: must not *"resell the Services except
  as expressly approved by Anthropic"*; §A.1 permits using the API *"to power products and services
  Customer makes available to its own customers and end users"* —
  https://www.anthropic.com/legal/commercial-terms. The 2026 reading drawn in coverage of the wrapper
  crackdown: redistribution covers *"any pattern where your product is primarily a conduit between
  the end user and the Anthropic API"* — https://www.sitepoint.com/end-wrapper-era-anthropic-api-terms-saas/
- OpenAI Terms of Use / Business Terms: may not *"resell or lease access to your account"*, may not
  share credentials, and may not *"buy, sell, or transfer API keys from, to or with a third party"* —
  https://openai.com/policies/row-terms-of-use/ , https://openai.com/policies/nov-2023-business-terms/

**Variants evaluated.**

- **(a) PAYG API keys, consumers pay the provider in USDC.** Not clean. No credential transfer
  occurs, but each provider becomes a micro-reseller whose "product" is a raw conduit to the
  Anthropic/OpenAI API — exactly the pattern §D.4 and the 2026 enforcement target. §A.1 protects
  *products*, not passthrough. Note also that API *credits* are non-transferable, so "donating
  leftover credits" can only ever mean "running requests through my account," which is the same
  analysis.
- **(b) BYOK compute-mediated results.** Same economic substance as (a) if what is sold is raw
  completions. Defensible only when the unit sold is a *work product* — "run a code review on this
  diff," "produce a patch for this failing test" — executed by the provider's own tooling on their
  own account, where the node has its own logic and is not a conduit. Must never accept subscription
  OAuth tokens; that is banned regardless.
- **(c) Credit-swap pool / barter.** No safer. "Resale" does not hinge on USDC versus in-kind
  consideration; running strangers' prompts through your account is still making your account
  available to others. Also a worse product (illiquid, no consumer story). Reject.
- **(d) Open-weight models via ollama/vLLM.** Fully clean. Llama Community License (fine below 700M
  MAU); Qwen3 and gpt-oss are Apache-2.0. No upstream ToS to violate. The "idle capacity" soul
  survives as idle *hardware* rather than idle *subscription seats*.

**Recommendation.** Hackathon: **(d) for the entire demo**, with the (b) agent-task tier as one
honest roadmap paragraph in the README. Real product: (d) as the base network plus (b) as a curated
tier; for first-party frontier models, pursue the *"except as expressly approved by Anthropic"* path
(an actual reseller agreement) — nothing else survives contact with enforcement.

## x402 payment design

End-to-end cycle (v1 wire format — what the Coinbase middleware and the KeeperHub wallet actually
speak today):

1. Consumer `POST https://api.declaude.xyz/v1/inference` with `{model, messages, max_tokens}`, no payment.
2. Broker responds `402`:

```json
{
  "x402Version": 1,
  "error": "Payment required",
  "accepts": [{
    "scheme": "exact",
    "network": "base",
    "maxAmountRequired": "10000",
    "resource": "https://api.declaude.xyz/v1/inference",
    "description": "declaude inference: qwen3-8b, up to 2048 output tokens",
    "mimeType": "application/json",
    "payTo": "0xBrokerReceiver...",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "maxTimeoutSeconds": 120,
    "extra": { "name": "USD Coin", "version": "2" }
  }]
}
```

`maxAmountRequired` is in USDC atomic units (6 decimals) — `10000` = $0.01. x402 v2 renames the
carrier to `PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE` headers; stay on v1 because
that is what the KeeperHub wallet, Coinbase's `x402-express`/`x402-hono` middleware, and the
facilitators interoperate on.

3. The consumer's wallet (KeeperHub agentic wallet hook, or `x402-fetch`) signs an EIP-3009
   `TransferWithAuthorization` (USDC → `payTo`, random 32-byte nonce, `validBefore` window) and
   retries with `X-PAYMENT: base64(PaymentPayload)`.
4. Broker `POST {facilitator}/verify` — signature, funds, amount. **Verify before generation.**
5. Broker checks the EIP-3009 nonce against its DB (replay guard), dispatches to a provider node,
   collects output.
6. Broker `POST {facilitator}/settle` — the facilitator broadcasts the USDC transfer and pays gas.
   **Settle before responding.**
7. Broker returns `200` with the completion and `X-PAYMENT-RESPONSE:
   base64({success, transaction, network})` — output and settlement hash in one response. That tx is
   what x402scan indexes.

**Pricing with unknown token count: flat price bands, pay-first.** price = f(model, max_tokens band).
The consumer declares `max_tokens`; the challenge quotes the band; generation is hard-capped at the
band; shorter output leaves the spread with the provider (postage-stamp pricing).

Why not the alternatives: **escrow / deposit-and-settle** (the `upto` scheme,
https://github.com/x402-foundation/x402/blob/main/specs/schemes/upto/scheme_upto.md , and the escrow
scheme PR https://github.com/coinbase/x402/pull/873) is the technically correct answer for metered
inference, but client support is thin, the KeeperHub wallet signs plain EIP-3009 exact transfers
only, and there is no time to build an escrow contract. **Prepaid balance topped up via x402** breaks
the zero-registration property that makes x402 interesting and reintroduces account state. Bands are
honest, simple, and payable by every x402 client. Roadmap: migrate to `upto`.

Failure handling: if generation fails on all candidate nodes, never call `/settle` — the
authorization expires unused and the consumer pays nothing, mirroring KeeperHub marketplace semantics
("callers are only charged on successful execution").

## Trust model

Consumer→broker payment fraud is structurally solved by x402 (authorization captured before output,
settled before response). Everything else:

| Attack | 4-day answer | Honest status |
|---|---|---|
| Provider serves a cheap model, claims a bigger one | Node signs an attestation over `sha256(request_id \| prompt_hash \| output_hash \| model \| completion_tokens)` with its node keypair (generated at `declaude init`, pubkey registered at onboarding); broker stores it and re-runs ~2–5% of jobs on a second node at temperature 0 with a fixed seed, comparing token streams. Open weights make re-execution *possible*, unlike closed APIs; exact byte-match is not guaranteed across hardware, so score similarity rather than require equality. A rolling canary score gates dispatch; failing nodes get delisted | Deterrent, not proof. Disclose. Real answer later: TEE attestation or stake + slashing on disputes |
| Prompt theft by the provider | Nothing real in 4 days — the node must see plaintext to run inference | **Accepted limitation, disclosed** in README and API docs. Named mitigations: provider pinning, reputation tiers, TEEs later |
| Consumer refuses to pay after output | Cannot happen: verify → generate → settle → *then* respond | Solved |
| Provider takes payment, returns nothing | Cannot happen: the consumer pays the **broker**, never the provider. The provider is credited in the ledger only on delivery; failed jobs are re-dispatched or left unsettled | Solved, at the cost of trusting the broker — disclose custodial v1 |
| Sybil providers / self-dealing | No token, no rewards, no subsidies — payouts are strictly a passthrough of real consumer USDC, so self-dealing burns the platform fee. Sybils only matter for canary collusion; keep canary assignment random and unannounced | Solved by construction for v1 |
| Payment replay | EIP-3009 nonces are single-use onchain; additionally the broker records each authorization nonce and rejects a duplicate `X-PAYMENT` **before** dispatching, so a replay cannot even extract a free generation that later fails at settle | Solved |

Minimum viable verification to actually ship: broker custody with delivery-gated crediting, node
attestation signatures, nonce dedupe, and canary re-execution behind a feature flag.

## Metering + config schema

Two counters with different jobs, deliberately disagreeing:

- **Broker (Postgres ledger) is authoritative for money** — per-node jobs, tokens, gross/net USDC,
  payout state. Providers are paid from this and only this.
- **Node-local counter is authoritative for provider protection** — the node enforces its own caps
  and never relies on the broker to stop sending work. Fail closed: append a usage record to a local
  JSONL ledger *before* returning a result (write-ahead); on restart, replay to rebuild counters; if
  the file is corrupt or missing, refuse jobs until `GET /v1/nodes/me/usage` supplies a floor to
  resume from. A crash mid-generation loses at most the in-flight job's count, and the loss direction
  is conservative — the node over-counts, never under-counts, its own spend.

`~/.declaude/config.json`:

```json
{
  "version": 1,
  "broker_url": "https://api.declaude.xyz",
  "node_token": "dcl_node_9f2c...redacted",
  "node_keypair_path": "~/.declaude/node_key.json",
  "backends": [
    { "type": "ollama", "base_url": "http://127.0.0.1:11434" }
  ],
  "models_allowlist": ["qwen3:8b", "llama3.1:8b", "gpt-oss:20b"],
  "limits": {
    "max_output_tokens_per_request": 4096,
    "max_tokens_per_day": 2000000,
    "max_tokens_total": 50000000,
    "max_requests_per_hour": 120,
    "max_concurrent_jobs": 2,
    "max_backend_spend_usd_per_day": 0,
    "active_hours_utc": { "start": "22:00", "end": "07:00" }
  },
  "kill_switch": false,
  "payout": {
    "address": "0xProviderWallet...",
    "chain_id": 8453,
    "min_payout_usdc": "1.00"
  },
  "state_file": "~/.declaude/usage.jsonl"
}
```

`kill_switch: true` (or `declaude stop`) drains in-flight jobs and disconnects; the broker also
exposes a kill toggle in the web UI that revokes the node token server-side, so either side can halt
independently. `max_backend_spend_usd_per_day` exists for the future agent-task tier and is `0`
(disabled) in the open-weight demo.

## Wallet verification flow

Roll our own SIWE for the broker; it is ~50 lines with the `siwe` npm package. **KeeperHub's headless
SIWE flow authenticates you to KeeperHub, not to us — wrong audience, cannot be reused for our
accounts.** Where it *is* used: once, operator-side, to provision the broker's KeeperHub org and mint
the `kh_` API key that executes payouts (`POST /api/auth/siwe/nonce` → `/api/auth/siwe/verify` →
`POST /api/keys` twice, with the step-up challenge signature). Copy its two hard-won lessons: cookie
handling with an `Origin` header on every mutation, and single-use nonces with short expiry.

Provider onboarding:

1. Web UI "Connect wallet" (wagmi/RainbowKit) → `POST /api/auth/nonce` → server stores
   `{nonce, expires: 5 min}`.
2. Wallet signs this exact EIP-4361 message:

```
app.declaude.xyz wants you to sign in with your Ethereum account:
0xAbC123...ProviderAddress

Register this wallet as a declaude provider payout address and sign in.

URI: https://app.declaude.xyz
Version: 1
Chain ID: 8453
Nonce: 8f14e45fceea167a
Issued At: 2026-08-09T14:00:00.000Z
Expiration Time: 2026-08-09T14:10:00.000Z
```

3. `POST /api/auth/verify {message, signature}` → `SiweMessage.verify()`: recovered address matches,
   domain matches `app.declaude.xyz`, nonce known + unexpired + unused, burn nonce → create/load the
   account keyed on address → set session cookie.
4. Provider configures limits in the UI (server-side copy), clicks "Create node" → server mints an
   opaque bearer node token `dcl_node_<32 bytes hex>` (stored hashed, revocable, one per machine) and
   shows `npx declaude init --token dcl_node_...`, which writes `~/.declaude/config.json` and
   generates the attestation keypair; then `npx declaude start`.
5. Consumers need no account at all — that is the entire point of x402. The same SIWE flow exists for
   consumers only if they want a dashboard.

The signed message proves control of the payout address before any USDC is sent to it; that is the
only thing it needs to prove, which is why a plain SIWE sign-in suffices.

## KeeperHub integration

Authenticity judgment: **authentic, not bolted on**, with one honesty note — the consumer-facing x402
endpoint is ours (Coinbase middleware + facilitator), and KeeperHub's role is the *onchain execution
layer for moving value out the back*, which is exactly what the hackathon says KeeperHub is for. The
settlement agent *decides* who is owed what and *executes* through KeeperHub. In priority order:

1. **Provider payouts via direct execution (the required tx link).** Per payout:
   `POST /api/execute/transfer` with `Authorization: Bearer kh_...`, body
   `{"chainId": 8453, "recipientAddress": "0xprovider...", "amount": "1.40", "tokenAddress":
   "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "simulate": true}` → on `success && !wouldRevert`,
   resend without `simulate` and with
   `Idempotency-Key: sha256("payout-{nodeId}-{periodISO}|8453|{addr}|{amount}|{usdc}")` → poll
   `GET /api/execute/{id}/status` honoring `X-Poll-Interval-Hint` → store `transactionLink` and the
   `receipts[]` array (`verified`, `receiptStatus`, `gasUsed`) and render them in the provider
   dashboard. That receipts panel *is* judging criterion 3 made visible.
2. **Consumer autopay via the KeeperHub agentic wallet.** Our 402 challenge is standard x402 / Base
   USDC, and the wallet "auto-pays any x402 or MPP 402 challenge you direct it at." Demo: a Claude
   Code session with `@keeperhub/wallet` installed calls our endpoint, hits 402, the `PreToolUse`
   hook auto-approves ≤$5, payment settles, inference returns. A second KeeperHub surface at zero
   extra build cost. **Constraint that dictates chain choice: the wallet's Turnkey limits allow only
   chain ids 8453/4217/42431 and only Base USDC / Tempo USDC.e — Base Sepolia (84532) is impossible.
   Consumer payments must run on Base mainnet.**
3. **Scheduled settlement via a KeeperHub workflow (stretch, ~2h).** Schedule trigger (hourly) →
   Webhook/HTTP action calling `POST https://api.declaude.xyz/internal/settlement/run` (HMAC-signed)
   → broker computes balances ≥ `min_payout_usdc` and fires the direct executions above. Shows the
   workflow-builder surface and makes payouts autonomous rather than operator-clicked — "agents
   onchain" literally.
4. **Marketplace listing (stretch).** A thin `declaude-inference` workflow (Manual trigger → HTTP
   call to broker → output) at $0.05 so it appears on x402scan under KeeperHub's registry and is
   exempt from execution quota. Risk: workflow execution timeout on slow generations; cap to a small
   fast model. Skip if tight.

## Architecture

```
 Consumer (agent w/ @keeperhub/wallet, or x402-fetch, or curl+eip3009 signer)
     │  POST /v1/inference  ──402──►  signs EIP-3009  ──X-PAYMENT──►
     ▼
 ┌──────────────── BROKER (Hono + TypeScript, Fly.io/Railway) ───────────────┐
 │  x402 middleware (x402-hono, CDP facilitator, Base mainnet USDC)          │
 │  ├─ verify → nonce-dedupe → dispatch → settle → respond                   │
 │  Dispatcher: model→node matching, per-node concurrency, 1 retry,          │
 │              120s timeout, canary sampler (flagged)                       │
 │  Ledger (Postgres, Drizzle): payments_in, jobs, node_usage,               │
 │              provider_balances, payouts, eip3009_nonces, attestations     │
 │  SIWE auth + node-token issuance (REST for web UI)                        │
 │  Settlement agent ──► KeeperHub POST /api/execute/transfer                │
 │        (simulate → idempotent broadcast → poll status → store receipts)   │
 └───────▲───────────────────────────────────────────────────────────────────┘
         │ outbound WebSocket (node dials out; providers need no open ports,
         │ no static IP — this is what makes "run it on your laptop" true)
 ┌───────┴──────── declaude-node (npm, TypeScript) ─────────────┐
 │  job runner → ollama http://127.0.0.1:11434 (backend adapter  │
 │  interface; future: vLLM, own-key agent-task tier)            │
 │  local limits enforcer + usage.jsonl WAL + kill switch        │
 │  attestation signer (ed25519 node key)                        │
 └───────────────────────────────────────────────────────────────┘
 Web UI (Vite + React + wagmi): SIWE, limits config, node token,
   live earnings, payout history with KeeperHub tx links + receipts
 State: broker Postgres = source of truth for money; node JSONL = provider
   self-protection; chain = x402 settle txs (consumer side, x402scan-indexed)
   + KeeperHub payout txs (provider side, transactionLink + receipts)
```

TypeScript everywhere: the x402 middleware, viem/siwe and the KeeperHub ecosystem
(`@keeperhub/sdk`, the wallet) are all TS-first, and one language across node/broker/UI is the only
sane choice on this timeline. WebSocket rather than polling or inbound HTTP because residential
providers sit behind NAT.

## 4-day minimum viable build

Real system, no mocks in the money path.

1. **Day 1 AM — money skeleton first (the demo's spine):** broker with `POST /v1/inference` behind
   `x402-hono` + CDP facilitator on Base mainnet, one hardcoded model, inference served by a local
   ollama on the broker box. Prove: curl → 402 → `x402-fetch` pays $0.01 → completion +
   `X-PAYMENT-RESPONSE` tx hash visible on Basescan/x402scan.
2. **Day 1 PM — KeeperHub payout path:** operator onboarding via the headless SIWE script (org +
   `kh_` key), fund the org wallet with ~$5 USDC on Base, execute one simulate → broadcast → poll
   payout, store `transactionLink` + `receipts`. **The hackathon's required artifact exists by end of
   day 1.** De-risk everything else afterwards.
3. **Day 2 — real provider node:** `declaude-node` npm package (WS dial-out, job protocol, ollama
   adapter, config file, local limits, usage WAL, attestation signature). Broker dispatcher + ledger
   tables + nonce dedupe. Two nodes online to show routing.
4. **Day 3 AM — web UI:** SIWE connect → limits form → node token issuance →
   `npx declaude init --token ...` → earnings page → payout history with KeeperHub tx links and the
   receipts/audit panel.
5. **Day 3 PM — KeeperHub consumer side + settlement automation:** demo a Claude Code session paying
   via `@keeperhub/wallet` (surface #2); KeeperHub scheduled workflow triggering settlement
   (surface #3) if it fits, else a broker cron with the workflow as roadmap.
6. **Day 4 — demo video + submission:** provider runs `npx declaude start` with limits → agent
   consumer hits 402, wallet auto-pays, gets a completion → x402scan/Basescan link for the payment →
   settlement runs → KeeperHub payout tx link with verified receipt → dashboard shows earnings and
   the audit trail. README with the honest limitations section and the ToS-compliance section
   explaining why open-weight. Submit with GitHub + video + the KeeperHub payout `transactionLink`.

Honest to disclose as stubbed: canary verification (flagged/roadmap), agent-task tier (roadmap),
`upto` metered pricing (roadmap), reputation (a counter, not a system). None sit in the money path,
so the demo contains zero fakes where value moves.

## What I would cut

- **All Claude/Codex subscription support. Not gated, not "BYO OAuth" — gone.** It is the one thing
  that can get the project publicly torched during judging.
- Raw Claude/OpenAI API passthrough, even BYOK — replaced by one roadmap paragraph on the agent-task
  tier.
- Escrow contracts, the `upto` scheme, per-token exact billing → flat price bands.
- Stake/slashing, TEEs, model fingerprinting research → attestation signatures + disclosure.
- MPP/Tempo support → x402/Base only (KeeperHub offers both; you need one).
- Multi-org/team features, consumer accounts, fiat anything.
- Marketplace listing of the endpoint as a KeeperHub workflow → only if Day 3 finishes early.
  *(Superseded: the sponsor-fit review made this listing mandatory — see SPEC §1 D1.)*
- Sepolia-first development for the consumer path — it dead-ends because the KeeperHub wallet cannot
  sign for 84532; go straight to mainnet with cents.

## Open questions for the human

1. **Can you fund ~$15–25 of real value?** (~$5–10 USDC broker org wallet for payouts, ~$5 USDC in a
   consumer wallet, buffer). The mainnet-with-cents plan depends on it; the fallback (Base Sepolia
   payouts + `x402-fetch` testnet consumer) loses the KeeperHub-wallet demo and looks weaker.
2. **What GPU/hardware is available for provider nodes?** `qwen3:8b` on a decent laptop is fine for a
   demo; on CPU-only boxes pick a ≤4B model and shorten `max_tokens` so generations fit the 120 s
   window.
3. **Name/branding check:** "declaude" contains "claude" — after cutting Claude support, keeping the
   name invites exactly the Anthropic-trademark/affiliation question the design just engineered out.
   Judges will also read it as "decentralized Claude reselling," the thing this report says not to
   build.
4. **Is KeeperHub's `/api/execute/transfer` ERC-20 path confirmed working on Base mainnet for your
   org tier** (gas sponsorship allowance, spending caps)? Verify on day 1 with a $0.10 payout before
   building the dashboard on top of it. Discord office hours can confirm plan limits quickly.
5. **Appetite for the Best Onboarding UX bounty?** The headless-onboarding pain points hit on day 1
   convert into a documented teardown or starter template for the stackable $1,000 bounty at ~2
   hours' cost.
6. **Post-hackathon intent?** If this is meant to live on, the "approved reseller" conversation with
   Anthropic and the escrow-scheme migration change the architecture enough to decide before writing
   more code on the flat-band custodial design.
