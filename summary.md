# Summary

One page. Detail in [`SPEC.md`](./SPEC.md) v3.0 and [`PLAN.md`](./PLAN.md).

## What we're building

**IdleProxy** — a metered proxy for idle coding-agent capacity. A provider runs one command; it
invokes the `claude` binary they already installed and logged into, as a subprocess, under a
throwaway `HOME`. Consumers point an unmodified Anthropic SDK at our base URL and pay per call in
Base Sepolia test-USDC. Every payment in and every payout out is executed onchain through KeeperHub.

For the **KeeperHub "Agents Onchain"** hackathon, deadline **2026-08-13 12:00 UTC+2**. $5,000 pool
plus a stackable onboarding-UX bounty of $1,000 split two ways.

Renamed from `DeClaude` — that name carried a trademark and asserted the exact framing the provider
disclosure warns about. `idleproxy` is unclaimed on npm.

## What validation on the machine changed

| Finding | Effect |
|---|---|
| `claude -p --bare` returns `"Not logged in"` despite a valid credential | `--bare` is out. Context stripping is done with a throwaway `HOME` instead — same property, plus real isolation |
| Trivial prompt costs **$0.1177** on the real HOME, **$0.0514** isolated (18.8k → 7.7k input tokens) | Isolation is a 3.6× cost cut, and price bands are set against a 7.7k floor |
| `codex` not installed, needs another paid login | One backend, two adapters (tool-free, containerized) |
| Docker 29.1.3 running | The tool tier ships. It is not conditional |
| Repo has zero commits | Publishing the repo is a scheduled task |

`total_cost_usd` is API-equivalent **notional** value, not money the provider spends. On a flat-rate
subscription the marginal cost is capacity. We meter in notional USD because it is the only figure
the CLI reports, and we never claim the provider was billed it.

## Shape

Monolith: one npm package, one `tsconfig`, one SQLite file, no frontend build step. Router, provider
node, treasurer agent and the bounty demo are subcommands of one binary. 15 source files.
Rejected: Postgres, Drizzle, React/Vite/wagmi.

## Schedule

| When | Work | Checkpoint |
|---|---|---|
| Aug 10 eve | Skeleton, settlement spike, money spine | **M1** — KeeperHub-executed settlement *and* an agent-executed payout. Submission becomes possible |
| Aug 11 | Provider node, dispatch, prepaid keys, Tier-1 container | Remote node serves a paid call; failover works; containerized exfil attempt fails |
| Aug 12 | UI, KeeperHub workflow breadth, bounty, README | Onboarding under 60 s; **freeze 22:00**; video exported |
| Aug 13 | Submit | Fresh tx links, visible before 11:00 UTC+2 |

## What we are honest about

Stated in the README under the intro, in provider onboarding, and on a card for the pitch:

- Relaying a consumer subscription **likely violates most providers' resale terms**. The demo runs on
  our own accounts at our own risk; what is submitted is the metering and settlement rail.
- The provider's machine sees every prompt in plaintext. No fix at this architecture.
- Model identity is **self-reported by the provider's CLI** and signed, not proven. Without a TEE
  that is the strongest honest claim available.
- Testnet units are worthless. This proves a mechanism, not an economy.
- Tier 1's egress allowlist is hostname-based and does not terminate TLS; a container escape defeats
  everything. Adequate for a disclosed demo, not for production.

## Document map

| File | Contents |
|---|---|
| [`SPEC.md`](./SPEC.md) | Validated facts, decisions, monolith layout, adapters, money flow, trust model, deleted scope |
| [`PLAN.md`](./PLAN.md) | Day-by-day build, gates, video shot list, demo-day failure modes |
| [`docs/anthropic-api-surface.md`](./docs/anthropic-api-surface.md) | Wire-level compatibility: requests, SSE, `/v1/models`, auth, errors |
| [`docs/provider-disclosure.md`](./docs/provider-disclosure.md) | Exact onboarding text and placement matrix |
| [`docs/hackathon/README.md`](./docs/hackathon/README.md) | Rules, prizes, judging criteria, submission checklist |
| [`docs/IMPLEMENTATION.md`](./docs/IMPLEMENTATION.md) | Condensed KeeperHub build guide |
| [`docs/keeperhub/`](./docs/keeperhub/) | Mirror of KeeperHub's docs |
| [`docs/validation/`](./docs/validation/) | Earlier agent review passes, kept for the reasoning trail |
