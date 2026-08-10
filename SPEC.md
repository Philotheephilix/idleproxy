# IdleProxy — a metered proxy for idle coding-agent capacity

**Spec v3.0 · 2026-08-10 · KeeperHub "Agents Onchain" hackathon · deadline 2026-08-13 12:00 UTC+2**

Supersedes v2.0 (`DeClaude`). v3.0 exists because v2.0 was validated against the actual machine and
three of its load-bearing claims were wrong. It also closes v2.0's open scope: there is no "future
work" section in this document. Every capability named here is built in the four-day window, and
everything that is not built is listed in §11 as deleted, with a reason — not deferred.

Companion: [`PLAN.md`](./PLAN.md). Wire shapes: [`docs/anthropic-api-surface.md`](./docs/anthropic-api-surface.md).
Disclosure text: [`docs/provider-disclosure.md`](./docs/provider-disclosure.md).

---

## 0. What it is

> You pay for a coding-agent subscription. Most hours it sits idle. IdleProxy meters that idle
> capacity out to agents that pay per call — and every payment in and every payout out is executed
> onchain through KeeperHub.

A provider runs one command. It invokes the `claude` binary **they already installed and logged
into**, as a subprocess, on their own machine. The OAuth token is never read, parsed, or transmitted
by us — we copy the credential file into a throwaway `HOME` and start the binary. Consumers point an
unmodified Anthropic SDK at our base URL and pay in Base Sepolia test-USDC.

**Rename from `DeClaude`.** The old name contained a trademark and asserted the exact framing the
provider disclosure warns about. `idleproxy` is unclaimed on npm (verified 2026-08-10).

---

## 1. Validated facts this spec is built on

Measured on the build machine, 2026-08-10. These replace assumptions in v2.0.

| # | Finding | Consequence |
|---|---|---|
| V1 | **`claude -p --bare` fails auth.** With a valid, unexpired Max OAuth credential it returns `{"is_error":true,"terminal_reason":"api_error","result":"Not logged in · Please run /login"}` in 46 ms. `--bare` skips the credential load path | `--bare` is **removed from the design**. Context stripping is done by running under a throwaway `HOME` instead — which strips CLAUDE.md, plugins, skills, hooks *and* isolates state, so it is strictly better |
| V2 | **The preamble dominates cost.** `"Say only: OK"` on the real `HOME`: **$0.1177**, 18,846 cache-creation input tokens. Same prompt under a throwaway `HOME`: **$0.0514**, 7,702. The 7.7k floor is the Claude Code system prompt and is not removable | Isolation is a **3.6× cost reduction**, not just a safety control. Price bands are set against a 7.7k-token floor, not against a bare API call |
| V3 | `--disallowed-tools`, `--strict-mcp-config`, `--output-format json`, `--permission-mode`, `--settings`, `--model` all exist in `claude` 2.1.226 | Tier 0 is implementable exactly as specified |
| V4 | Docker 29.1.3 present, daemon reachable | Tier 1 (container) ships. It is not conditional |
| V5 | `codex` is **not installed** and requires a separate paid login | Single backend. The `Backend` interface stays and is exercised by **two** adapters (§5), so it is a real abstraction rather than a decorative one |
| V6 | Node v22.22.1, npm 9.2.0 | `better-sqlite3` and Hono both fine. No Postgres |
| V7 | Repo has **zero commits** and no remote | Publishing the repo is a scheduled task, not an afterthought |

**Cost honesty, stated once and repeated in the README:** `total_cost_usd` from the CLI is
*API-equivalent notional value*, not money the provider spends. On a flat-rate subscription the
provider's marginal cost is **capacity**, not dollars. IdleProxy meters and prices in notional USD
because that is the only number the CLI reports; it never claims the provider was billed that amount.

---

## 2. Decisions locked

| # | Decision | Why |
|---|---|---|
| D1 | **KeeperHub broadcasts the x402 settlement**, not just payouts. We are our own facilitator: verify the EIP-3009 signature locally, then settle via `POST /api/execute/contract-call` → `transferWithAuthorization` on Base Sepolia USDC | Without it every payment would settle outside KeeperHub and the sponsor integration is decorative. With it, **no transaction in the system touches the chain except through KeeperHub** |
| D2 | **Two execution tiers, both shipped.** Tier 0 tool-free (default); Tier 1 tool-enabled inside a disposable, egress-locked container | The containment lever is tools, not prompt shape. Tier 0 with tools off is a raw completion. Tier 1 is where the differentiated product lives, and Docker is present, so it ships rather than being promised |
| D3 | **One backend, two adapters.** `claude-code/tier0` and `claude-code/tier1` | V5. Two adapters over one binary still forces the interface to be real: different capabilities, different capacity units, different runners. A second vendor buys nothing a judge can see in 2:30 |
| D4 | **Base Sepolia 84532, $0.00 budget** | Circle faucet USDC + KeeperHub gas sponsorship |
| D5 | **Flat price bands, pay-before-generate, hard `max_tokens` cap** | Token count is unknown until generation ends. Band is quoted from `model` + `max_tokens`; the runner caps generation at the band ceiling |
| D6 | **Anthropic-compatible `/v1/messages` is the primary surface**, with OpenAI-compatible and MCP surfaces alongside | `ANTHROPIC_BASE_URL=…` plus an unmodified SDK works |
| D7 | **Signed attestation over the CLI's self-reported model.** No canary re-execution | These CLIs are nondeterministic; equality checking is dead on arrival. We can prove *what the provider's CLI reported for this exact prompt→output*, signed. That is the strongest honest claim without a TEE |
| D8 | **Caps in notional USD + request count + concurrency, with a reserve fraction** | The CLI reports notional dollars and token counts and nothing about remaining quota. Caps are enforced from a local write-ahead log |
| D9 | **Dual auth: prepaid `ipx_sk_` key *and* raw x402 challenge** | A stock `@anthropic-ai/sdk` treats a 402 as a fatal `APIStatusError` — it cannot pay a challenge. "Change one URL" is only true on the prepaid path. Both ship |
| D10 | **Monolith.** One npm package, one process per role, one SQLite file, no build step for the UI | Four days. Every extra boundary is a place to lose an hour. §4 |

**Model IDs.** Always `<adapter>/<model>` — `claude-code/sonnet`, `claude-code/opus`,
`claude-code-tools/sonnet`. A bare upstream ID is never served, so a consumer can never mistake the
proxy for a first-party endpoint.

---

## 3. Actors

| Actor | Runs | Holds |
|---|---|---|
| **Provider** | `npx idleproxy node` + their own `claude` login | EVM payout address, node token, ed25519 attestation key |
| **Consumer** | Any Anthropic/OpenAI SDK; optionally a viem EOA with faucet USDC | Prepaid `ipx_sk_` credit, or test-USDC for x402 |
| **Router** | `idleproxy serve` — Hono + SQLite, one process | Dispatch, ledger, node registry, capacity state |
| **Treasurer** | `idleproxy treasurer` — spawns Claude Code with the KeeperHub MCP server attached | The `kh_` org API key |

The treasurer is an **agent** that reads pending balances, checks treasury solvency, decides the
batch, and executes the transfers through MCP tool calls. It is not a shell script with an LLM
sticker on it, because the hackathon asks for a transaction *an agent* executed.

---

## 4. Repository layout — monolith

One `package.json`. One `tsconfig.json`. One database file. No workspaces, no monorepo tooling, no
frontend build step.

```
idleproxy/
├── package.json            bin: { idleproxy }
├── tsconfig.json
├── .env.example
├── Dockerfile.job          Tier-1 job image
├── egress-proxy.conf       nginx CONNECT allowlist for the Tier-1 network
├── README.md  SPEC.md  PLAN.md
├── public/                 UI — static, served by the router, no bundler
│   ├── index.html
│   ├── app.js              vanilla ESM + window.ethereum
│   └── style.css
├── src/
│   ├── cli.ts              entry. subcommands: serve | node | treasurer | doctor | facilitator-demo
│   ├── config.ts           env + CHAIN_PROFILE {chainId, usdc, eip712Domain, explorerBase}
│   ├── db.ts               schema + migrations, better-sqlite3
│   ├── keeperhub.ts        REST client: contract-call, transfer, status poll, idempotency handling
│   ├── x402.ts             challenge build, EIP-3009 verify, nonce dedupe
│   ├── pricing.ts          bands, model→band, notional accounting
│   ├── filter.ts           input abuse / credential-exfil filter
│   ├── attest.ts           ed25519 sign + verify
│   ├── ledger.ts           balances, fee split, payout batching
│   ├── dispatch.ts         node registry, capacity gate, headroom ranking, retry, failover
│   ├── server.ts           Hono app: all HTTP + WS surfaces + static
│   ├── treasurer.ts        spawns Claude Code with KeeperHub MCP, drives the payout run
│   └── node/
│       ├── agent.ts        WS dial-out, caps enforcement, usage WAL, kill switch
│       ├── tier0.ts        throwaway-HOME tool-free runner
│       └── tier1.ts        docker runner
└── docs/                   unchanged reference material + the bounty tutorial
```

15 source files. The provider node, the router, the treasurer and the bounty demo are **subcommands
of one binary**, so a provider installs nothing extra and there is one dependency tree to keep green.

**Stack, and what was rejected.** Hono + `better-sqlite3` + `viem` + `hono/streaming`. Rejected:
Postgres (an external service to provision, for one demo), Drizzle (a migration toolchain for seven
tables), React/Vite/wagmi (a bundler and 300 transitive packages for four screens that need
`window.ethereum.request` and `fetch`).

---

## 5. Adapters

```ts
interface Backend {
  id: AdapterId;                                  // "claude-code" | "claude-code-tools"
  capabilities(): Capabilities;                   // models, contextWindow, tools, streaming, reportsCostUsd
  capacity(model?: string): Promise<Capacity>;    // available, headroom 0..1, reason, resetAt
  run(job: Job, signal: AbortSignal): Promise<RunResult>;
  usage(): Promise<UsageSnapshot[]>;              // read back from the local WAL
}
```

### `claude-code` — Tier 0, tool-free (default path)

Per job: create `$TMP/ipx-<jobid>/{home,work}`, copy `~/.claude/.credentials.json` into
`home/.claude/`, write `home/.claude/settings.json` as `{}`, then

```
HOME=<jobdir>/home  cwd=<jobdir>/work
claude -p "<prompt>"
  --model <sonnet|opus|haiku>
  --output-format json
  --strict-mcp-config
  --disallowed-tools "Bash,Read,Edit,Write,WebFetch,WebSearch,Glob,Grep,NotebookEdit,Task,TodoWrite"
```

Delete the job directory afterwards, always, including on timeout.

The throwaway `HOME` does four things at once: no `CLAUDE.md` leaks into a stranger's output, no
plugins or skills load, no session or history state is written to the provider's real profile, and
the measured cost drops 3.6× (V2). The credential is a **copy** in a directory destroyed after the
job; the provider's real `~/.claude` is never opened by the child.

`--bare` is not used (V1). `--permission-mode` is not relied on: `dontAsk` still allows the read-only
command set, which can `cat` a secret, so it is not tool-free. The native OS sandbox contains **Bash
subprocesses only** — Read/Edit/Write bypass it — so it is defense in depth and never the control.

Metering source is the result JSON: `total_cost_usd`, `usage.{input_tokens, output_tokens,
cache_creation_input_tokens, cache_read_input_tokens}`, `modelUsage` (per-model breakdown, and the
attestation's `model_reported`), `num_turns`, `duration_ms`.

Throttle detection: `is_error: true` with `terminal_reason: "api_error"`, a non-zero exit, or a
`system/api_retry` event carrying `rate_limit` / `overloaded` in stream mode. Any of these sets
`available: false` with a `resetAt` backoff.

### `claude-code-tools` — Tier 1, containerized

Same binary, tools **enabled**, always inside a container:

```
docker run --rm --network ipx-jobnet --user 10001:10001
  --memory 2g --pids-limit 256 --cpus 1.5 --read-only
  --tmpfs /work:size=1g --tmpfs /home/job:size=256m
  -e HOME=/home/job -e HTTPS_PROXY=http://ipx-egress:3128
  -e CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1
  --mount type=bind,src=<jobdir>/creds.json,dst=/home/job/.claude/.credentials.json,ro
  idleproxy-job:latest  claude -p "<prompt>" --model … --output-format json
    --permission-mode bypassPermissions --strict-mcp-config
```

`ipx-jobnet` is `docker network create --internal` — containers on it have **no route to the
internet**. The only reachable host is `ipx-egress`, an nginx forward proxy dual-homed onto the
bridge network whose config (`egress-proxy.conf`) permits `CONNECT` to `api.anthropic.com:443` and
nothing else. No host bind mounts except the read-only credential copy. Wall clock 180 s, killed on
breach.

Capacity is reported separately per adapter, so a provider can enable Tier 0 only. Tier 1 is
**opt-in at onboarding with its own checkbox**, because it is a materially larger exposure.

---

## 6. Money flow

### Inbound — x402 path

1. Consumer calls `/v1/messages` with no payment → **402** carrying the x402 challenge: scheme
   `exact`, network `base-sepolia`, asset `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals),
   `maxAmountRequired` in atomic units, `payTo` = org wallet, `nonce`, `validBefore`.
2. Consumer signs EIP-3009 `TransferWithAuthorization` and retries with the `X-PAYMENT` header.
3. Router verifies the signature locally (`viem.verifyTypedData` against the domain read from the
   contract), checks `to`, `value`, `validAfter/validBefore`, and **inserts the nonce into
   `eip3009_nonces` before dispatch**. A replay cannot even extract a free generation.
4. Dispatch to a node whose `capacity(model).available` is true, ranked by headroom.
5. **Settle through KeeperHub** — `POST /api/execute/contract-call`, FiatToken ABI passed explicitly
   containing **only the `(…,v,r,s)` overload**, `simulate: true` first; on `success && !wouldRevert`
   broadcast with `Idempotency-Key` = **the EIP-3009 nonce**; poll `/api/execute/{id}/status`
   honoring `X-Poll-Interval-Hint` until `receipts[].verified`.
6. Respond with the completion, plus `x-idleproxy-attestation`, `x-idleproxy-settlement-tx`, and
   `x-idleproxy-node` headers.

If **every** candidate node fails, we never settle: the authorization expires unused and the consumer
pays nothing. Settlement strictly precedes the response body, so a consumer can never take output
without paying.

The nonce doubles as the idempotency key deliberately — it is already unique per payment, so one
value makes settlement replay-safe at the HTTP layer (KeeperHub idempotency) *and* at the chain layer
(EIP-3009 single-use nonce).

### Inbound — prepaid path (D9)

`POST /api/keys` with an x402 payment of any band multiple mints an `ipx_sk_…` key credited with the
paid amount minus fee. Subsequent `/v1/messages` calls authenticate with `x-api-key: ipx_sk_…`, debit
the local balance, and never see a 402. This is the path where "change one environment variable and
your existing SDK works" is literally true. The funding payment settles through KeeperHub on the
identical code path as §6 inbound — the prepaid path adds a ledger, not a second settlement design.

### Pricing bands

Set against the measured 7.7k-token floor (V2), not against a bare API call.

| Band | `max_tokens` ≤ | Price | Provider credit (80%) |
|---|---|---|---|
| S | 256 | $0.02 | $0.016 |
| M | 1024 | $0.05 | $0.040 |
| L | 4096 | $0.15 | $0.120 |

`opus` is one band up from the same `max_tokens`. Requests above 4096 `max_tokens` are rejected with
400 and a message naming the ceiling — an unbounded request cannot be priced before generation.

### Outbound

Ledger credits the provider 80% (20% protocol fee). At ≥ $1.00 accrued, or on the scheduled run, the
treasurer agent runs the payout — but the solvency check and the transfer are **KeeperHub workflow
steps, not a REST call our code makes**. A workflow (`Payout Request` Webhook trigger → `Check
Treasury Balance` → `Solvency Gate` Condition → `Pay Provider` transfer, true branch only) owns that
logic natively; the agent's job is to invoke it correctly and confirm the result, via MCP
`execute_workflow(workflowId, {body: {to, amount, providerId}})` then `get_execution` polled to a
terminal state. Verified live on Base Sepolia — see `docs/tx-links.md`.

The workflow trigger itself carries no idempotency key (unlike the Direct Execution endpoints), so
replay-safety for the payout is a local concern: `payoutIdempotencyKey` —
`sha256("payout|{providerId}|{period}|{chainId}|{addr}|{amount}|{token}")` with `period` a full
timestamp per treasurer invocation, not a date slice, because the threshold trigger can fire more
than once a day — and `ledger.existingPayoutStatus` skips re-invoking the workflow for a key already
`verified` or `broadcast`. `recordPayoutBroadcast` is an `ON CONFLICT DO NOTHING` upsert so a retry
is a no-op instead of a crash.

MCP tool arguments are snake_case; REST is camelCase. `execute_workflow`'s `input` field is
camelCase JSON regardless (it is the workflow's own input shape, not a Direct Execution call).

### Cost

**$0.00.** Faucet USDC from Circle, gas sponsored by KeeperHub's Gas Station on Base Sepolia. The
binding limit is the rate limit, not money: 60 direct-executions/min per key, and a settlement is
simulate + broadcast + ≥1 status read ≈ 3 requests, so the ceiling is **15–20 paid calls/min** before
payout traffic. Documented, and the router queues rather than failing when it is approached.

### Mainnet is one env var

`CHAIN_PROFILE` carries `{chainId, usdcAddress, eip712Domain:{name,version}, explorerBase}`. The
EIP-712 domain `name` differs between the two USDC deployments, which is exactly why it is read off
the contract at boot and never hardcoded. Nothing in the source contains `84532`, a token address, or
a domain string.

---

## 7. Trust model

| Attack | Answer | Status |
|---|---|---|
| Provider serves a cheap model and claims an expensive one | Node signs `ed25519(sha256(request_id ǀ adapter ǀ model_reported ǀ prompt_hash ǀ output_hash ǀ tokens ǀ cost_usd))` where `model_reported` is the CLI's own `modelUsage` key. Router cross-checks cost plausibility against the band and the token counts, and flags outliers | Deterrent, not proof. **Disclosed**: model identity is self-reported by the provider's CLI |
| Credential theft via prompt injection | Tier 0: no file-read tool exists and the credential is never in the model's context — it is a file the harness points `HOME` at. Tier 1: read-only credential copy, no host mounts, `--internal` network, `CONNECT` allowlisted to one host | Solved for Tier 0, contained for Tier 1 |
| Prompt confidentiality | The provider's machine must see plaintext to run the CLI | **Accepted and disclosed.** No fix exists at this architecture |
| Provider's own context leaking into consumer output | Throwaway `HOME` + empty cwd means no `CLAUDE.md`, no skills, no plugins, no history | Solved (this was an open risk in v2.0) |
| Provider account actioned for consumer-generated content | Input filter, per-consumer rate limits, per-provider caps, kill switch, disclosure | Partial — a real retained risk |
| Consumer takes output without paying | Settlement precedes the response | Solved |
| Provider delivers nothing after payment | Consumer pays the router; the provider is credited only on delivery | Solved, at the cost of trusting the router — disclosed |
| Payment replay | Nonce is single-use onchain and deduped locally before dispatch | Solved |
| Sybil / self-dealing | No token, no emissions; payouts pass through real consumer USDC, so self-dealing burns the fee | Solved by construction |

---

## 8. Provider disclosure

Check-to-accept at onboarding, before a node token is issued. Full text and placement matrix in
[`docs/provider-disclosure.md`](./docs/provider-disclosure.md). Abridged:

1. You are offering **your own paid subscription** to anonymous third parties for payment. We copy
   your credential into a throwaway home directory and start the program you installed; the token is
   never read, parsed, or transmitted. The requests it answers are billed to your subscription and
   count against your limits.
2. **This may violate your provider's Terms of Service.** Anthropic's terms restrict reselling or
   sharing subscription capacity. Your account is at risk of suspension, with no recourse from us. Do
   not connect an account you cannot afford to lose.
3. Consumers send prompts you cannot see in advance and cannot control.
4. Default execution is **tool-free**. Tool-enabled execution is a separate opt-in and runs in an
   isolated container; isolation is strong, not perfect.
5. You set hard caps and a reserve. Enforcement is best-effort, from figures the CLI self-reports — a
   strong bound, not a guarantee. Kill switch at any time.
6. **This is testnet.** Payouts are Base Sepolia test-USDC with no monetary value.
7. This version is **custodial**. Payouts are executed via KeeperHub and independently verifiable
   onchain.

The README carries the matching note **directly under the intro**, above the architecture. The pitch
answer, if a judge asks: relaying a consumer subscription likely does violate most providers' resale
terms, which is why the demo runs on our own accounts at our own risk, and why the proxy is
deliberately backend-agnostic — what is submitted is the metering and settlement rail, which does not
care what sits behind the adapter.

---

## 9. Risks that are still open, and the exact fallback

Each has a decision point on the timeline in `PLAN.md`, not an open-ended "we'll see".

| # | Risk | Fallback, pre-decided |
|---|---|---|
| R1 | `transferWithAuthorization` through `/api/execute/contract-call` — the EIP-712 domain, the two FiatToken v2.2 overloads (`(…,v,r,s)` and `(…,bytes)`) with undocumented `functionName` disambiguation, and `abi`/`functionArgs` being JSON-**string** fields | Read `name()`/`version()` off the contract at boot; pass an ABI containing only the `(v,r,s)` overload; uints as decimal strings, `nonce`/`r`/`s` as `0x` hex. **If it still fails:** consumer broadcasts the transfer directly and a KeeperHub Block-trigger workflow verifies it and releases the job. Weaker — KeeperHub-observed rather than KeeperHub-executed — but the submission still qualifies. Decision by **Aug 10, 22:00** |
| R2 | Event-trigger chain coverage on 84532 is undocumented | Block trigger + `web3/read-contract` instead. Decision by **Aug 12, 12:00** |
| R3 | KeeperHub rate limit (60/min) under demo load | Router queues settlements and surfaces queue depth. Demo uses ≤3 calls/min |
| R4 | Claude Code 5-hour rolling window exhausts mid-demo | Two provider nodes on two accounts; router fails over. Pre-warm check in the run-book |
| R5 | Tier-1 image cold start on camera | Image built and `docker pull`-warm before recording; one throwaway job run at rehearsal |

---

## 10. Surfaces built

| Surface | Path | Purpose |
|---|---|---|
| Anthropic Messages | `POST /v1/messages` (+ SSE when `stream: true`) | Primary consumer surface |
| Model list | `GET /v1/models` | Advertises what online nodes can serve right now |
| OpenAI Chat Completions | `POST /v1/chat/completions` | Shape translation onto the same dispatch path |
| MCP | `POST /mcp` | One tool, `relay_prompt`, for MCP-native clients |
| Node link | `WS /node` | Provider dial-out; NAT-friendly, no open ports |
| Provider API | `/api/siwe/*`, `/api/provider/*` | SIWE, disclosure, caps, token, kill switch, earnings |
| Prepaid keys | `POST /api/keys` | Mints `ipx_sk_` credit from an x402 payment |
| Settlement hook | `POST /internal/settlement/run` | HMAC-authed, called by the KeeperHub Schedule workflow |
| Audit | `GET /api/audit` | Mirrors KeeperHub `get_execution` records into the dashboard |
| UI | `GET /` | Static provider dashboard |

### KeeperHub surfaces used

`/api/execute/contract-call` (x402 settlement, direct) · `/api/execute/{id}/status` (settlement
polling, receipts) · **Payout workflow** (Webhook trigger → `web3/check-token-balance` → `Condition`
solvency gate → `web3/transfer-token`, live: `docs/tx-links.md`) · Gas Station sponsorship · MCP
server with `kh_` header auth — the treasurer's hands, calling `execute_workflow` + `get_execution`,
not raw Direct Execution · Schedule workflow → settlement hook · Block-trigger + `read-contract`
reconciliation workflow with a Condition node and a Discord alert on drift · `kh` CLI
(`kh workflow run … --wait`, `kh run logs`) · `get_execution` audit mirroring.

---

## 11. Deleted from scope — not deferred

There is no roadmap section. Each of these is a closed decision with a reason.

- **A second vendor backend (Codex, Gemini, opencode).** V5: not installed, needs another paid
  subscription. The `Backend` interface is exercised by two adapters with genuinely different
  capacity units and runners, which is what makes it real.
- **Canary re-execution for model verification.** These CLIs are nondeterministic; output equality
  cannot be a signal. Attestation (D7) is the honest substitute.
- **Non-custodial settlement.** Requires escrow contracts and an audit. The custody is disclosed.
- **KeeperHub agentic-wallet consumer autopay.** Not available on 84532.
- **Marketplace listing.** Mainnet-only. `POST /mcp` on our own server preserves the MCP DX story.
- **Escrow and the x402 `upto` metered scheme.** `exact` + hard `max_tokens` cap prices correctly
  before generation, which is the whole reason bands exist.
- **Multi-turn conversation state.** `/v1/messages` is stateless by contract: the consumer sends the
  full message array each call. Sessions are not missing, they are not part of the API.
- **Reputation with stake and slashing.** Meaningless when the units are worthless.
- **Mainnet.** One env var (§6). Deliberately not flipped: real money plus disclosed ToS exposure is
  not a hackathon posture.

## 12. What honestly cannot work

- **Real economic value.** Testnet units are worthless. This proves a mechanism, not an economy.
- **Model-identity proof.** Without a TEE you cannot prove a provider served Opus and not Haiku.
- **Prompt confidentiality.** The provider's machine sees plaintext. No fix at this architecture.
- **Exact capacity accounting.** The CLI exposes no "N requests remaining". Capacity is inferred
  from local caps plus observed throttling; the reserve fraction is a blunt hedge.
- **Upstream compliance.** Invoking the provider's own binary keeps the token inside its permitted
  surface, but selling that capacity to third parties is squarely what the terms target. Testnet
  play-money and provider-runs-their-own-binary reduce exposure; they do not make this compliant.
- **Tier 1 against a determined attacker.** The egress allowlist is hostname-based and the proxy does
  not terminate TLS, so domain-fronted exfiltration is conceivable, and a container escape defeats
  everything. Adequate for a disclosed demo with our own credentials; production wants gVisor or
  Firecracker and a TLS-terminating proxy.
