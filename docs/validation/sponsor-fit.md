# Sponsor-fit and end-to-end report

> ⚠️ **Superseded pass.** This is the *first* audit, run before the budget went to zero. Its core
> finding — that KeeperHub must be load-bearing, not decorative — drove the whole design and still
> stands. But its fix (a mainnet marketplace paid listing) is impossible on testnet, and the
> agentic-wallet autopay path is dead on chain 84532. The replacement is settlement-broadcast through
> KeeperHub; see [`../../SPEC.md`](../../SPEC.md) v2.0 §1 D1. Kept for the qualification reasoning
> and the competitive read.

Hackathon qualification audit for the DeClaude idea. Produced 2026-08-09 by an independent
validation agent (Fable 5). Preserved near-verbatim.

## Qualification verdict

**AT-RISK as pitched → PASS after one redesign.** The idea as written — "consumers pay providers per
inference via x402 (USDC on Base)" — does not touch KeeperHub at all: x402 is an open protocol you
can implement with Coinbase's facilitator and never make a single KeeperHub call. That fails the one
hard requirement ("every project must use KeeperHub as its onchain execution layer") and gets
rejected in stage-1 review regardless of polish. The fix is cheap and makes the project *stronger*:
(1) list the inference endpoint as a **KeeperHub marketplace paid workflow** so KeeperHub *is* the
x402/MPP payment rail (402 challenge, settlement, x402scan indexing, revenue landing in our creator
wallet), and (2) execute **provider payouts through KeeperHub Direct Execution** (simulate →
idempotency-key → poll → verified receipts) driven by a "treasurer" agent over the KeeperHub MCP
server. Money then flows into the system through KeeperHub and out of it through KeeperHub —
load-bearing in both directions, and it produces exactly the linkable transaction the submission form
demands.

## Qualification checklist

| Rule (from the hackathon page) | Status | Detail |
|---|---|---|
| "Every project must use KeeperHub as its onchain execution layer" | **AT-RISK → PASS with redesign** | Raw idea: KeeperHub decorative (FAIL). Redesigned: KeeperHub settles every consumer payment (marketplace x402/MPP) and broadcasts every provider payout (`POST /api/execute/transfer`). No non-KeeperHub onchain path remains |
| "Ship a **working agent** that executes through KeeperHub" | **PASS (must be framed)** | Two real agents: the consumer agent (Claude Code + `@keeperhub/wallet`, autopays the 402) and the treasurer agent (drives `execute_transfer` / `get_direct_execution_status` via KeeperHub MCP). Do not demo this as "a web app" — lead with the agents |
| GitHub link (platform-required) | PASS | Public repo; make it public *before* submitting — judges cannot see a private repo and "incomplete submissions cannot be judged" |
| Demo video showing the agent executing onchain through KeeperHub | PASS | Script below; ends on BaseScan + x402scan |
| Link to a transaction the agent executed via KeeperHub | PASS | Submit two: the treasurer's USDC payout tx (BaseScan, from the KeeperHub status `transactionLink`) and the x402 settlement tx of a paid inference call (x402scan). Base mainnet — beats a testnet link |
| Deadline 2026-08-13 12:00 UTC+2 (DoraHacks renders "08/13 10:00") | PASS with buffer | Treat **Aug 13, 09:00 UTC** as the internal cutoff |
| Eligibility: worldwide, 18+, non-OFAC | ASSUMED PASS | Cannot verify team members' age/jurisdiction — confirm before submitting |

## Judging criteria map

Criterion 1 is explicitly the heaviest ("Execution is weighted heavily, because that is the point").

| Criterion | What we build | How the demo shows it | Effort |
|---|---|---|---|
| 1. Executes onchain via KeeperHub **(most weighted)** | Payout engine: `simulate:true` → `Idempotency-Key` → `POST /api/execute/transfer` (USDC, Base 8453) → poll status → `receipts[].verified` | Live on camera: treasurer agent pays a provider; cut to BaseScan showing the USDC `Transfer` event; x402scan showing the inference payment settlement | 4h |
| 2. Use of KeeperHub surfaces | Marketplace x402 listing + per-workflow MCP + aggregate MCP + agentic wallet + workflow builder (scheduled payout) + `kh` CLI cameo + audit trail | Each surface gets 5–15 s of screen time; README has a "KeeperHub surfaces used" table with 9 rows | see table below |
| 3. Reliability & observability | Simulation logged next to the receipt; deterministic idempotency keys (SHA-256 of `payoutId\|chainId\|addr\|amount\|token`); 409 `originalExecutionId` replay handling; `X-Poll-Interval-Hint` backoff; Runs-panel audit trail mirrored into our web UI via `get_execution` | Show the sim result and receipt side by side; show the KeeperHub Runs panel (trigger → HTTP → output, gas, timestamps); mention the 409-as-answer path in narration and README | 3h |
| 4. Originality & real-world usefulness | Two-sided market monetizing idle inference capacity; providers set hard caps (max tokens, $/day, model allowlist) in the npm node | Provider onboarding in 30 s; a *different* agent pays $0.05 and gets a real completion — "agents paying agents" is literally the event's thesis | core build |
| 5. Integration quality & DX | Typed per-workflow MCP tool (`/mcp/w/declaude-inference`) so any agent installs our product as one tool; clean npm package; bounty CLI | One command on camera adds our tool to Claude Code; repo README quickstart | 1h |

## KeeperHub surface coverage plan

Ranked by (score impact) / (hours). Total incremental cost beyond the core build ≈ 7h.

| # | Surface | How we touch it (authentically) | Impact | Hours |
|---|---|---|---|---|
| 1 | **x402 paid marketplace listing** | List `declaude-inference` at **$0.05/call** (≥$0.05 is quota-exempt, hard cutoff at $0.049). Workflow: Manual trigger `{prompt, model, max_tokens}` → `webhook/send-webhook` POST to our router → output schema exposes the completion. **Slug is permanent** — develop on `declaude-inference-dev`, list the clean slug once | Core; the payment rail | 6 (incl. router) |
| 2 | **Direct execution (simulate + idempotency + receipts)** | Treasurer payouts, safe first-write sequence verbatim | Core; criterion 1 | 4 |
| 3 | **MCP server (aggregate)** | Treasurer agent = Claude Code + `https://app.keeperhub.com/mcp` (use a `kh_` key header, not OAuth — no 1h token expiry on camera) calling `execute_transfer`, `get_direct_execution_status` | High | 2 |
| 4 | **Per-workflow MCP `/mcp/w/declaude-inference`** | Free once listed; the consumer installs our product as a single typed tool | High / near-zero cost | 0.5 |
| 5 | **Agentic wallet autopay** | Consumer runs `npx -p @keeperhub/wallet keeperhub-wallet skill install` + `add`; $0.05 < default `auto_approve_max_usd` of $5 → silent autopay; mention the three-tier hook on camera | High | 1 |
| 6 | **Workflow builder + Schedule trigger** | Scheduled daily payout workflow (Schedule → HTTP to router `/pending-payouts` → Condition ≥ threshold → `web3/transfer-token`) shown in the visual builder | Medium-high | 3 |
| 7 | **Audit trail** | Runs panel on camera; our UI shows per-call execution logs via `get_execution` | Medium (criterion 3) | 2 |
| 8 | **MPP / Tempo** | Free: every marketplace listing offers both x402 (Base USDC) and MPP (Tempo USDC.e, chain 4217) — state it in README and video; write no Tempo-specific code | Medium / zero | 0 |
| 9 | **Gas sponsorship** | Base payouts ride the Turnkey Gas Station (relayer pays gas); show `sponsored: true` in the status JSON and explain the EOA-txlist caveat — the judges' own docs flag this as an expert detail | Medium | 0 |
| 10 | **`kh` CLI** | One shot: `kh workflow run <payout-wf> --wait` + `kh run logs` | Low-medium | 0.5 |
| 11 | **Headless SIWE onboarding** | Reused as the bounty artifact (below) | Bounty | (bounty) |

Skip: Solana, DeFi protocol plugins, Safe — no authentic fit, and forced use reads as padding.

## Money flow

**Inbound (per inference call):**

1. Consumer agent calls the listed workflow (or the `/mcp/w/declaude-inference` tool) → HTTP **402**
   with an x402 challenge.
2. `@keeperhub/wallet`'s PreToolUse hook intercepts and signs an EIP-3009 `TransferWithAuthorization`
   for **$0.05 USDC on Base (chainId 8453, token
   `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)**; KeeperHub's facilitator submits onchain and pays
   gas; indexed on x402scan under KeeperHub's server entry. The consumer needs **zero ETH**.
3. Split: $0.05 gross → platform fee → **net lands in our org's creator wallet on Base**. At $0.05
   the call is exempt from our monthly execution quota. *(Fee percentage and threshold: verify Day 1.)*
4. The workflow's HTTP node forwards `{prompt, model, max_tokens}` to our router → provider npm node
   (enforcing its own caps) → completion returned as the workflow output. The caller is charged only
   on successful execution.

**Outbound (payouts):** the provider ledger accrues per-call credit off-chain in the router DB. When
the balance reaches **$1.00** (~36 calls) or daily at 00:00 UTC, the treasurer agent runs, from the
**org wallet**: `POST /api/execute/transfer` `{chainId: 8453, tokenAddress: 0x8335…2913,
recipientAddress: <provider>, amount: "1.12"}` — `simulate:true` first, then broadcast with
`Idempotency-Key = sha256("payout|<providerId>|<date>|8453|<addr-lowercase>|1.12|0x8335…2913")`, then
poll until `receipts[].verified: true`.

**Cap analysis (nothing breaks at demo scale):**

- Turnkey hard limits (100 USDC/transfer, 200 USDC/UTC day, Base USDC + Tempo USDC.e only, chains
  8453/4217/42431) bind the **consumer's agentic wallet only**. $0.05 is 0.05% of the per-transfer
  cap; the 200/day cap equals **4,000 paid calls/day per consumer wallet** — a production ceiling to
  mention honestly, not a demo problem.
- Payouts come from the **org wallet** (a different wallet, not under those Turnkey policies) but
  under the org's configurable daily spending cap (`403 Daily spending cap exceeded`) and the 60
  req/min direct-execution rate limit.
- Micro-economics: batching is what makes small payouts sane — unsponsored Base gas ≈ $0.001–0.01 per
  ERC-20 transfer would be up to ~30% overhead per call; batched at $1+ it is <1%, and sponsorship
  usually makes it ~0 anyway.

**Chain decision: Base mainnet 8453 for everything in the demo.** The x402/MPP settlement rail is
mainnet-only (Base USDC / Tempo USDC.e — there is no testnet x402 path in the docs), so the paid call
forces mainnet; putting the payout on Base mainnet too makes the submission's tx link a *real-money*
transaction, which is exactly what "a working transaction beats a polished demo" rewards. Base
Sepolia 84532 is the rehearsal chain: a zero-value self-transfer lands with a zero-balance wallet
(documented, sponsored) — use it Day 1 to prove the pipeline for free. **Recommendation: batched
payouts**, threshold $1 in production, lowered to **$0.10 for the demo** so a payout triggers after
2–3 live calls.

**Demo budget:** consumer agentic wallet $5 USDC (Base); org wallet $5 USDC + 0.002 ETH (~$8) as a
gas fallback if sponsorship preflight fails. **Total < $20.**

## Bounty play

**Artifact: `npx keeperhub-first-tx`** — a one-command starter (separate small repo + npm package):
SIWE sign-in with a throwaway key → step-up-signed API key creation → wait for org wallet provisioning
→ simulate → sponsored **zero-value self-transfer on Base Sepolia** → print the `transactionLink`.
Zero to a first executed KeeperHub transaction in under 60 seconds, no browser, no faucet, no
funding — the bounty's definition, verbatim. Nearly free for us: the docs' headless-onboarding page
already contains the reference script; we package it with good errors and a README tutorial.

Attach a **teardown** of the six traps hit along the way — missing `Origin` producing two *different*
403 strings; a cached step-up challenge and the 10-strike lockout; EIP-55 mixed-case rejection;
`simulate` needing to be a JSON boolean; sponsored txs invisible in the EOA's explorer txlist; the
empty-wallet `CALL_EXCEPTION` that reads as a broken endpoint — each with proposed doc/DX fixes. That
covers three of the four accepted bounty forms (template + tutorial + teardown) in one submission.
~4–6 hours. Stackable with the grand prize; $1,000 split two ways, so a credible entry has good odds
against a field that will mostly submit nothing for it.

## Demo video script

Target 2:30. **Pre-warmed** before recording: listing live under the final slug and **called once**
(x402scan indexing latency is unknown), both wallets funded, MCP servers added with `kh_` key auth,
provider node running, payout threshold set to $0.10, browser tabs pre-logged-in (dashboard, BaseScan,
x402scan). **Live on camera, non-negotiable:** the paid inference call and the payout execution. The
local `demo-recording` skill can produce this against a production build.

| Time | Shot | Proves |
|---|---|---|
| 0:00–0:15 | Title + one line: "Idle AI-subscription credits on one side, agents that need inference and can pay USDC on the other. DeClaude connects them — entirely on KeeperHub rails." | Framing |
| 0:15–0:40 | Provider onboarding web UI: connect wallet → sign verification message → set caps (max tokens, $/day, model allowlist) → copy credentials → `npx declaude-node start` → "node online" in the UI | Criterion 4; onboarding UX (bounty echo) |
| 0:40–1:10 | Consumer terminal: `claude mcp add … /mcp/w/declaude-inference` (one typed tool), then ask Claude a question. Show the **402 challenge → agentic-wallet autopay ($0.05, under the $5 auto-approve tier) → retry → completion**. Flash `keeperhub-wallet balance` before/after: −$0.05 | Criteria 2, 5 |
| 1:10–1:35 | KeeperHub dashboard: Earnings page (invocations, gross, our share), then the **Runs panel audit trail** of that exact call (trigger → HTTP node → output, timestamps) | Criteria 2, 3 |
| 1:35–2:05 | Treasurer agent (Claude Code via the aggregate MCP): "Pay out providers." Show `execute_transfer` with `simulate:true` → `wouldRevert:false, gasEstimate` → broadcast with `Idempotency-Key` → poll → `status: completed, receipts:[{verified:true, receiptStatus:"success", gasUsed}]`, `sponsored:true` | **Criterion 1 + 3, the money shot** |
| 2:05–2:25 | Click `transactionLink` → **BaseScan tx page, USDC Transfer event to the provider address** (open the token-transfer/logs view — the summary line shows the relayer and 0 ETH because it is sponsored; narrate that in one sentence, it demonstrates expertise). Quick cut to **x402scan: our workflow listed under KeeperHub + the inference payment settlement** | Submission requirement #3, on screen |
| 2:25–2:30 | Card: "Every payment in, every payout out — executed through KeeperHub." + repo URL | Close |

## Demo-day failure modes

| Failure | Symptom on camera | Defense |
|---|---|---|
| x402 facilitator latency / flake | Paid call hangs after 402 | Pre-warm one paid call minutes before recording; keep a pre-recorded backup take; retry is safe (callers charged only on success) |
| Consumer wallet underfunded → 402 retry loop | Wallet signs, settlement rejected, agent loops | `keeperhub-wallet balance` in the pre-flight checklist; fund $5 (100 calls of headroom) |
| Ask-tier prompt interrupts autopay | Inline permission prompt mid-demo | $0.05 ≪ default `auto_approve_max_usd: 5` — do **not** lower that default during rehearsal |
| Inference slower than the workflow HTTP-node timeout | Workflow run fails, caller sees an error | Timeout undocumented (the Code plugin allows ≤120 s) — test Day 1; demo with a fast model and `max_tokens: 150` |
| Sponsored payout "invisible" | Someone checks the org EOA on BaseScan → "nothing happened" | Never show the EOA txlist; show `transactionLink` and the receipts array; narrate the relayer/EIP-7702 detail as a feature |
| Gas sponsorship preflight silently fails | Payout falls back to direct signing; fails if the org wallet has 0 ETH | Keep 0.002 ETH in the org wallet; check the `sponsored` field, do not assume |
| MCP OAuth token expires (1 h) mid-take | Tool calls 401 | Authenticate both MCP servers with a `kh_` API key header instead of OAuth |
| Rate limits | 429s | SIWE: 20 nonces / 10 verifies **per hour per IP** — do not loop the bounty CLI in rehearsal from the demo IP; direct execution's 60/min is ample; honor `Retry-After` |
| Idempotency conflict on retry | 409 mid-demo | Treat as an answer: poll `originalExecutionId`. Keys are deterministic per payout period, so a retry replays instead of double-paying — say so, it is criterion-3 gold |
| Provider node offline | Inference call errors | The router health-checks nodes and falls back to our own house node, always running during the demo window |
| RPC flakiness | Balance reads / explorer slow | Set custom primary + fallback RPC per chain in KeeperHub Settings; pre-load explorer tabs |
| Marketplace slug mistake | The slug is permanent | Build and test on `declaude-inference-dev`; list the clean slug only when the workflow is final |

## Competitive positioning + one-line pitch

With 434 registered and $5k on the table, expect 40–80 real submissions clustering in three shapes:
(a) the quickstart turned into a project — a chat agent doing a testnet transfer via MCP; (b) DeFi
babysitters built from the 14 protocol plugins and templates (Aave health checks, rebalancers); (c)
alert/notification bots with one token transfer bolted on. Almost all will use one surface (MCP) and
one transaction type.

We stand out on exactly the axes the host scores: bidirectional money flow through KeeperHub (payment
rail *and* payout executor), breadth of surfaces including the three newest ones KeeperHub is clearly
promoting (paid marketplace, per-workflow MCP, agentic wallet), textbook reliability mechanics, and a
product that is itself "agents paying agents" — plus a finalist-pitch flex no one else can make:
*any judge can install our MCP tool and pay us $0.05 live during the pitch.*

Blend-in risk: if the video leads with the web UI, we look like a SaaS demo. Lead with the agents and
the transactions.

**One-line pitch:** "DeClaude turns idle AI-coding-assistant credits into a pay-per-call inference
market where every request settles through a KeeperHub x402 marketplace listing and every provider
payout is executed by an agent through KeeperHub — money in and money out, all on KeeperHub rails."

## Day-by-day timeline Aug 9–13

| Day | Work | Hard checkpoint (EOD UTC+2) |
|---|---|---|
| **Sat Aug 9** | KeeperHub account + org; creator wallet via dashboard; `kh_` key; agentic wallet provisioned; Base Sepolia **zero-value sponsored self-transfer** via API (free proof of pipeline); list a **$0.05 throwaway workflow** and self-pay it once with the agentic wallet to resolve the creator-wallet question (blocker #1); fund wallets (~$20) | One KeeperHub-executed tx hash exists; money-flow ambiguity resolved empirically, or asked in Discord office hours |
| **Sun Aug 10** | Core: router service + `declaude-node` npm package (OpenAI-compatible proxy with caps); inference workflow built on the `-dev` slug; end-to-end paid call working; measure the HTTP-node timeout | A consumer agent pays $0.05 and receives a real completion through KeeperHub |
| **Mon Aug 11** | Provider onboarding web UI (connect wallet, sign, caps, credentials); payout engine (treasurer agent + scheduled workflow, full simulate/idempotency/poll/receipts); audit trail surfaced in the UI; list the final `declaude-inference` slug | Full loop closed: onboard → call → earn → **payout tx visible on BaseScan** |
| **Tue Aug 12** | Freeze features by noon. Bounty artifact `keeperhub-first-tx` (4–6 h); README with surfaces table + architecture diagram; **record the demo video** (pre-warm checklist, then live takes); repo public; draft the DoraHacks BUIDL form with both tx links | Video exported and submission form fully drafted by 22:00 |
| **Wed Aug 13** | Final read-through; fresh tx links (re-run one paid call + payout in the morning so links are <24 h old); **submit by 09:00 UTC (11:00 UTC+2)** — one hour of buffer against the platform's "10:00" rendering ambiguity; separately submit the bounty entry | BUIDL submitted and confirmed visible on the hackathon page **before 11:00 UTC+2** |

## Hard blockers I could not resolve

1. **Creator wallet vs org execution wallet.** Marketplace revenue "lands directly in your
   organization's creator wallet"; the agentic-wallet FAQ calls the creator wallet "a separate
   Turnkey sub-org." Whether `/api/execute/transfer` (which spends the *org* wallet) can spend
   marketplace revenue directly — or whether a dashboard withdrawal (a step-up-gated action) must
   bridge them — is not determinable from the docs. **Resolve empirically Day 1** with the $0.05
   self-pay test. Mitigation either way: pre-fund the org wallet with our own USDC so payouts never
   depend on revenue routing; the economics stay honest.
2. **Marketplace HTTP-node execution timeout** for a 5–30 s inference call is undocumented (only the
   Code plugin's 1–120 s is). Test Day 1; the fallback design is an async job-id plus a `get-result`
   second workflow (uglier; avoid unless forced).
3. **Whether the org daily spending cap ("in wei") meters ERC-20 transfers** or only native value —
   affects nothing at demo scale; check the dashboard setting Day 1.
4. **Listing approval latency** — the docs imply listing is instant and self-serve; if there is a
   review queue, the Day-1 throwaway listing surfaces it with 4 days to spare.
5. **Live-page drift** — this analysis used the local mirror scraped 2026-08-09; re-check the
   DoraHacks announcements tab on Aug 12 for judging/format updates.
6. **Eligibility facts** (18+, non-sanctioned jurisdiction for every team member) — outside what an
   agent can verify.
