# IdleProxy — implementation plan

Companion to [`SPEC.md`](./SPEC.md) v3.0. **Today is 2026-08-10.** Submission closes
**2026-08-13 12:00 UTC+2**; internal cutoff **09:00 UTC (11:00 UTC+2) on Aug 13**, one hour of buffer
against the platform's ambiguous deadline rendering.

Three and a half working days, zero lines of code written, and the repo has no commits. The plan is
therefore ordered by **risk retired per hour**, not by architecture layer.

Everything in SPEC §10 is built here. Nothing in this plan says "later". §11 of the spec is the list
of things that do not exist, and it is closed.

**Sequencing rule:** prove the settlement primitive → make the submission technically possible →
widen. Milestone M1 is the point after which a total disaster still leaves a qualifying entry.

---

## Day 0 — Aug 10, evening (~5 h) · Skeleton + the spike + M1

### 0.1 Repo (30 min)

- [ ] `git init` is already done but has **zero commits** — make the first one now, then push. A
      private repo is fine until Aug 12; judges cannot review a repo that does not exist.
- [ ] Rename `DeClaude` → `IdleProxy` / `declaude` → `idleproxy` across `README.md`, `docs/**`,
      `summary.md`. One pass, verified with `grep -ril declaude .`
- [ ] `package.json` (`"name": "idleproxy"`, `"bin": {"idleproxy": "dist/cli.js"}`, `"type":
      "module"`), `tsconfig.json` (NodeNext, strict, `outDir: dist`), `.env.example`.
      Dependencies, complete list: `hono`, `@hono/node-server`, `better-sqlite3`, `viem`, `ws`,
      `zod`. Dev: `typescript`, `tsx`, `@types/node`, `@types/ws`, `@types/better-sqlite3`.
- [ ] `src/config.ts` — env parse with zod. `CHAIN_PROFILE` resolved at boot by reading `name()` and
      `version()` off the USDC contract (never hardcoded, SPEC §6).
- [ ] `src/cli.ts` — subcommand dispatch: `serve | node | treasurer | doctor | facilitator-demo`.
- [ ] `idleproxy doctor` — the environment gate, written first because it is what stops Day 2 from
      being a debugging session: checks `claude` on PATH and its version, credential file present and
      `expiresAt` in the future, a live `claude -p` round-trip under a throwaway HOME, Docker daemon
      reachable, KeeperHub `kh_` key valid, treasury USDC balance, RPC reachable. Prints a pass/fail
      table.

### 0.2 THE SPIKE — settlement through KeeperHub (2 h) · retires R1

This is the one call the whole design rests on. Do it before any server code.

- [ ] `src/keeperhub.ts`: `simulate()`, `contractCall()`, `transfer()`, `pollStatus()` honoring
      `X-Poll-Interval-Hint`, and idempotency-outcome handling (409 `idempotency_conflict` with a
      **nullable** `originalExecutionId`, `idempotency_in_progress`, `idempotentReplay: true`).
      Critical parsing detail: **"would revert" arrives as HTTP 400, not a 200 with a flag** — parse
      the body for `wouldRevert` before treating a 400 as an error.
- [ ] `src/x402.ts`: build the challenge, sign one authorization with a throwaway EOA, verify it with
      `viem.verifyTypedData`.
- [ ] Free rehearsal first: sponsored **zero-value self-transfer** via `/api/execute/transfer` —
      simulate, broadcast, poll, read `receipts[]`. Costs nothing and proves auth plus the safe-write
      sequence end to end.
- [ ] Then the real thing: settle a hand-signed EIP-3009 authorization through
      `/api/execute/contract-call`. ABI passed explicitly containing **only** the `(…,v,r,s)`
      overload; uints as decimal strings; `nonce`, `r`, `s` as `0x` hex; `Idempotency-Key` = nonce.

**Gate, 22:00 Aug 10:** a KeeperHub-executed `transferWithAuthorization` tx hash exists on 84532 —
**or** R1's fallback is declared and the Block-trigger verify-and-release path is what gets built.
Do not start 0.3 until one of those is true.

### 0.3 M1 — the money spine (2.5 h)

- [ ] `src/db.ts` — schema and migrations in one file, `better-sqlite3`, WAL mode. Nine tables:
      `providers`, `nodes`, `node_capacity`, `consumer_keys`, `payments_in`, `eip3009_nonces`,
      `jobs`, `provider_balances`, `payouts`, plus `events` for the audit feed.
- [ ] `src/pricing.ts` — bands S/M/L per SPEC §6, model→band, `max_tokens > 4096` → 400.
- [ ] `src/server.ts` — `POST /v1/messages`: 402 challenge → verify → **insert nonce before
      dispatch** → run → settle → respond. Inference is served in-process by the Tier-0 runner on the
      router box for tonight; the WS node path lands tomorrow.
- [ ] `src/node/tier0.ts` — throwaway-`HOME` runner exactly as SPEC §5. Job directory deleted in a
      `finally`, including on timeout.
- [ ] `src/treasurer.ts` — spawn `claude -p` with `--mcp-config` pointing at
      `https://app.keeperhub.com/mcp` with the `kh_` header, `--strict-mcp-config`, and a prompt that
      instructs it to read pending balances, gate on solvency, and execute. Run the **first payout**
      tonight.

**M1 gate — the important one:** a consumer paid test-USDC, KeeperHub broadcast the settlement, a
completion came back, and **an agent** executed a payout through KeeperHub. Both tx links saved to
`docs/tx-links.md`. *The submission is now technically possible even if everything after this fails.*

Agent-ification is not deferred past M1 on purpose: eligibility asks for a transaction **your agent**
executed. Discovering an MCP auth problem on Aug 12 would be fatal; tonight it costs an hour.

---

## Day 1 — Aug 11 (~12 h) · Provider node, dispatch, prepaid keys, Tier 1

### 1.1 Provider node (3 h)

- [ ] `src/node/agent.ts`: outbound WebSocket dial to `WS /node` (providers behind NAT need no open
      ports, no static IP), reconnect with backoff, heartbeat, job protocol.
- [ ] Caps enforcer in the units the CLI actually reports: daily notional USD, daily request count,
      max concurrency, reserve fraction. **Fail closed** — an unreadable WAL means `available:
      false`, never "assume fine".
- [ ] `usage.jsonl` write-ahead log: append *before* spawning, amend on completion, replay on
      restart. This is the only durable record of what the node has spent.
- [ ] ed25519 keypair generated on `init`, public key registered at first connect; `src/attest.ts`
      signs the tuple from SPEC §7.
- [ ] CLI: `idleproxy node --token … [--tier1]`, plus `status`, `caps`, `earnings`, `stop`.

### 1.2 Dispatch (2 h)

- [ ] `src/dispatch.ts`: node registry, health from heartbeat, model→adapter match, `capacity()`
      gate, headroom ranking, **one retry on a different node**, house-node fallback.
- [ ] Router verifies each attestation against the registered pubkey and cross-checks reported cost
      against band and token counts; outliers are flagged in `events` and shown in the dashboard.
- [ ] `GET /v1/models` built from what online nodes report *right now*, not a static list.

### 1.3 Consumer surfaces (2 h)

- [ ] SSE streaming for `stream: true` — `message_start`, `content_block_delta`, `message_delta`,
      `message_stop`. Settlement completes before the first byte of the stream.
- [ ] `POST /v1/chat/completions` — OpenAI shape translation onto the same dispatch path.
- [ ] `POST /mcp` — one tool, `relay_prompt`, streamable HTTP.
- [ ] `POST /api/keys` — x402 payment mints an `ipx_sk_` key with credit; `x-api-key` auth debits
      locally and never 402s. **Verify with an unmodified `@anthropic-ai/sdk`** and nothing but
      `ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY` changed. That test is the headline claim; if it
      fails, the claim comes out of the video.
- [ ] `src/filter.ts` — input filter for credential-exfil and abuse patterns, applied before dispatch
      on both paths.
- [ ] Per-consumer and per-node rate limits.

### 1.4 Tier 1 container (3 h) · retires R5

- [ ] `Dockerfile.job`: `node:22-slim`, `@anthropic-ai/claude-code` installed, non-root uid 10001.
- [ ] `docker network create --internal ipx-jobnet` + the `ipx-egress` nginx forward proxy
      (`egress-proxy.conf`) allowing `CONNECT api.anthropic.com:443` only. Attach the proxy to both
      networks; attach jobs to `ipx-jobnet` only.
- [ ] `src/node/tier1.ts`: run flags exactly as SPEC §5 — `--read-only`, tmpfs `/work` and
      `/home/job`, memory 2 g, pids 256, cpus 1.5, read-only credential bind, `HTTPS_PROXY`, 180 s
      wall clock, killed on breach.
- [ ] **Prove the isolation on camera-quality evidence:** run a job whose prompt asks the agent to
      read `/etc/passwd` and POST it to a webhook. Capture the refusal/failure. That clip is the
      answer to the first hard question a judge asks, and it is worth 20 minutes.

### 1.5 Commit discipline

Commit at each sub-section boundary. A working tree at 02:00 with 4,000 uncommitted lines is how
hackathons are lost.

**Day 1 gate:** a paid call is served by a *remote* node; pulling its plug reroutes the next call; a
node at its cap reports `available: false` and receives no work; a Tier-1 job runs containerized and
the exfiltration attempt fails.

---

## Day 2 — Aug 12 (~12 h) · UI, KeeperHub breadth, bounty, freeze at 22:00

### 2.1 Web UI (3 h)

`public/` — static, served by the router, no bundler. Four screens in one page.

- [ ] Connect wallet → SIWE (`personal_sign` via `window.ethereum`, nonce from `/api/siwe/nonce`).
- [ ] **Disclosure accept** — the full SPEC §8 text, check-to-accept, with a **separate second
      checkbox for Tier 1**. No node token is issued without it.
- [ ] Caps form (daily USD, daily requests, concurrency, reserve) → node token → the exact
      `npx idleproxy node --token …` line, copy-button.
- [ ] Live earnings, job feed with per-job attestation and settlement tx link, payout history with
      KeeperHub `transactionLink` + `sponsored` + `receipts[].verified`, and the kill switch.

**Gate:** a fresh wallet goes from connect to earning node in **under 60 seconds**, on camera, with
no config file edited by hand.

### 2.2 KeeperHub surface breadth (3 h) · retires R2

Directly scored by judging criterion 2, and most of it is configuration rather than code.

- [x] **Payout moved into a KeeperHub workflow, done Day 0 evening.** Solvency check (`Check Treasury
      Balance` → `Solvency Gate` Condition) and the transfer (`Pay Provider`) are native workflow
      steps; the treasurer agent calls `execute_workflow` + `get_execution` over MCP instead of raw
      `execute_transfer`. Live tx in `docs/tx-links.md`. Local replay-safety (`existingPayoutStatus`,
      `ON CONFLICT DO NOTHING`) covers what the workflow trigger's missing idempotency key doesn't.
- [ ] **Scheduled settlement workflow**: Schedule → HTTP POST to `/internal/settlement/run` (HMAC).
      Do the thresholding **inside the router** — the Webhook plugin's "Send Webhook" action exposes
      only `success` and `error`, so a downstream Condition has no response body to compare against.
- [ ] **Reconciliation workflow**: Block trigger (R2's fallback is already the default choice) +
      `web3/read-contract balanceOf` → Condition comparing against the ledger → Discord alert on
      drift.
- [ ] `GET /api/audit` mirroring KeeperHub `get_execution` records into the dashboard.
- [ ] **Validate every workflow** with `validate_workflow` *and* one manual run. When building via
      API/MCP use the canonical keys `abiFunction` and `functionArgs` — `functionName` and `args`
      save cleanly and then fail at execution with a missing-`abiFunction` error.
- [ ] `kh` CLI cameo: `kh workflow run <payout-wf> --wait`, `kh run logs`.
- [ ] README "KeeperHub surfaces used" table + architecture diagram.

### 2.3 Bounty entry (2 h)

Reuses `src/keeperhub.ts` and `src/x402.ts` — a subcommand and a tutorial, not a second package.

- [ ] `idleproxy facilitator-demo` — signs a throwaway EIP-3009 authorization and settles it through
      `/api/execute/contract-call`, printing the `transactionLink`. Zero to a KeeperHub-executed
      third-party settlement in one command.
- [ ] `docs/bounty/x402-facilitator.md` — the tutorial: **being your own x402 facilitator on
      KeeperHub**. That pattern appears nowhere in KeeperHub's docs, and the genuinely undocumented
      traps found in the Day-0 spike (overload ambiguity, ABI/`functionArgs` string serialization,
      `wouldRevert` arriving as a 400) are the teardown content.
- [ ] Submit as a separate entry.

Deliberately **not** shipped: a teardown of the six onboarding traps. Every one of them is already
documented in KeeperHub's own docs; restating the judges' documentation back to them is not an entry.

### 2.4 README + repo public (1 h)

- [ ] One-liner, **the provider-terms note directly under the intro**, architecture diagram,
      KeeperHub surfaces table, quickstart for both sides, the honest-limitations section (SPEC §12),
      the mainnet env var, the measured-cost note from SPEC §1.
- [ ] Repo **public**. Incomplete or unreviewable submissions cannot be judged.

### 2.5 Freeze 22:00 and record (3 h)

**Feature freeze at 22:00 Aug 12. No exceptions.** Remaining time is rehearsal and recording.

- [ ] Pre-warm: wallets faucet-funded (draw again today — Circle rate-limits), workflows enabled,
      MCP added with `kh_` header auth, two provider nodes running, Tier-1 image pulled warm, payout
      threshold lowered to $0.10, explorer and dashboard tabs pre-loaded.
- [ ] Record the 2:30 video. Live on camera, non-negotiable: **one paid inference** and **one
      payout**. Keep a backup take of the settlement segment.
- [ ] Create the DoraHacks BUIDL as a **draft tonight**, not on submission morning. Unknown form
      mechanics are not something to meet an hour before a deadline.

### Video shot list (2:30)

| Time | Shot | Criterion |
|---|---|---|
| 0:00–0:15 | Hook: "You pay for a coding-agent subscription. Most hours it sits idle. IdleProxy meters that capacity out to agents that pay per call — settled onchain through KeeperHub." | framing |
| 0:15–0:40 | Provider UI: connect → sign → accept disclosure → set caps → `npx idleproxy node` → node online. One spoken sentence on provider terms | 4 |
| 0:40–1:15 | **Money shot, split screen.** Left: an unmodified `@anthropic-ai/sdk` with one changed env var. Right: the router calling KeeperHub — simulate (`wouldRevert: false`) → broadcast → `receipts:[{verified:true}]`, `sponsored:true` → completion returns. Narrate: *the settlement itself was executed by KeeperHub* | 1, 2, 3 |
| 1:15–1:35 | Tier 1: the exfiltration prompt runs containerized and fails. Then the KeeperHub Runs panel: reconciliation workflow trigger → read → condition → alert | 2, 3 |
| 1:35–2:05 | Treasurer agent in Claude Code via MCP: "pay providers" → solvency gate → `execute_transfer` with an idempotency key → poll → completed | 1 |
| 2:05–2:25 | sepolia.basescan.org: the payout `Transfer` event to the provider; cut to a settlement tx. Narrate why both are relayer-broadcast — "check the logs, not the EOA txlist" | submission req. 3 |
| 2:25–2:30 | Card: "Every payment in and every payout out, executed through KeeperHub. Runs on $0." + repo URL | close |

---

## Day 3 — Aug 13, before 09:00 UTC · Submit

- [ ] Re-run one paid call and one payout so both tx links are **under 24 h old**.
- [ ] Submit the BUIDL: GitHub + video + **both** tx links. Designate the **treasurer's payout** as
      the primary "transaction the agent executed via KeeperHub" — the settlement is router-executed,
      so it is the second link, not the headline.
- [ ] Confirm eligibility explicitly: 18+, no sanctioned/OFAC jurisdiction.
- [ ] Submit the bounty entry separately.
- [ ] **Visible on DoraHacks before 11:00 UTC+2.**

---

## Demo-day failure modes

| Failure | Symptom | Defense |
|---|---|---|
| EIP-712 domain mismatch on 84532 USDC | Signature verifies locally, simulate reverts | Spiked Day 0; `name()`/`version()` read off the contract at boot, never hardcoded |
| Proxy ABI auto-fetch misses `transferWithAuthorization` | contract-call 400 | Always pass the FiatToken ABI explicitly |
| Overload ambiguity | Wrong signature selected, or a 400 | Pass an ABI containing **only** the `(…,v,r,s)` overload |
| Simulate answers "would revert" | Arrives as **HTTP 400**, not a 200 with a flag | Parse the body for `wouldRevert` before treating a 400 as an error. A naive `status >= 400` wrapper throws the answer away |
| 409 `idempotency_conflict` | Reads as an error mid-demo | It is an answer: poll `originalExecutionId`. When it is **null**, do not rotate the key — look up by provider+period |
| Duplicate settlement attempt | Would double-charge | Nonce-as-idempotency-key returns the original execution and the chain rejects the reused nonce. **Trigger it deliberately on camera** — it is criterion-3 gold |
| Testnet RPC flakiness | Simulate/poll timeouts | Custom primary + fallback RPC in KeeperHub Settings; retry with the **same** idempotency key |
| Circle faucet rate limit | Cannot refill mid-rehearsal | Draw USDC on Aug 10 *and* Aug 12; rehearse with $0.02-band calls |
| Gas sponsorship preflight fails | Payout falls back to direct signing and fails at 0 ETH | Keep faucet ETH in the org wallet; read the `sponsored` field, never assume it |
| MCP OAuth expiry (1 h) | 401 mid-take | Authenticate MCP with a `kh_` key header, not OAuth |
| Claude credential expires mid-demo | `"Not logged in"`, 46 ms, `is_error: true` | The OAuth access token is short-lived. `idleproxy doctor` checks `expiresAt` before every take; the node re-checks per job and marks itself unavailable rather than failing a paid call |
| Claude Code 5-hour window exhausts | Node reports unavailable | Two nodes on two accounts; router fails over. Rehearse the failover |
| Provider node CLI hangs | Inference stalls on camera | Router timeout → retry on the second node → house node always running |
| Slow generation vs router timeout | Errors | Demo uses band S, `max_tokens: 150`; measured on Day 1 |
| Someone checks the org EOA txlist | "Nothing happened" | Sponsored txs never appear there. Show `transactionLink` and receipts, and narrate it as expertise |
| KeeperHub 60/min rate limit | Settlements queue | ~3 requests per settlement means a real ceiling near 15–20 calls/min. Demo stays under 3/min; the router surfaces queue depth |

---

## Timeline

| Day | Work | Hard checkpoint |
|---|---|---|
| **Mon Aug 10 (eve)** | 0.1–0.3 | **M1**: KeeperHub-executed settlement + an agent-executed payout. Both tx links saved |
| **Tue Aug 11** | 1.1–1.5 | Remote node serves a paid call; failover works; Tier-1 exfil attempt fails |
| **Wed Aug 12** | 2.1–2.5 | UI < 60 s onboarding; workflows validated; **freeze 22:00**; video exported; BUIDL drafted |
| **Thu Aug 13** | submit | Fresh tx links; **visible before 11:00 UTC+2** |

## If a day slips

Scope is fixed; the schedule is not. If Day 1 runs over, the compression order is: the OpenAI
`/v1/chat/completions` shape translation (30 min of the smallest surface), then the second provider
node (routing is still demonstrable with a node and the house node), then the bounty entry. In that
order, and only that far — **never** the KeeperHub-executed settlement, the agent-executed payout
with simulate + idempotency + receipts, the treasurer being a real agent, both tx links, the video,
the provider disclosure, or the honest-limitations section.
