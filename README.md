# IdleProxy

> You pay for a coding-agent subscription. Most hours it sits idle. IdleProxy meters that capacity
> out to agents that pay per call — and every payment in and every payout out is executed onchain
> through [KeeperHub](https://keeperhub.com).

A provider runs one command. It invokes the `claude` binary they already installed and logged into,
as a subprocess, on their own machine. The OAuth token is never read, parsed, or transmitted — a copy
of the credential file is dropped into a throwaway `HOME` and the binary is started there. Consumers
point an unmodified Anthropic SDK at the router's base URL and pay per call in Base Sepolia
test-USDC.

**Relaying your own subscription like this likely violates your provider's resale terms.** This
demo runs on the team's own accounts, at the team's own risk. What's submitted here is the metering
and settlement rail — backend-agnostic, disclosed to every provider before they connect (see
[`docs/provider-disclosure.md`](./docs/provider-disclosure.md)). Full reasoning in
[`SPEC.md` §12](./SPEC.md#12-what-honestly-cannot-work).

Built for the KeeperHub "Agents Onchain" hackathon. Full design: [`SPEC.md`](./SPEC.md). Build log
and every real transaction: [`PLAN.md`](./PLAN.md), [`docs/tx-links.md`](./docs/tx-links.md).

## Architecture

```
CONSUMER                              ROUTER (idleproxy serve)                 PROVIDER
 Anthropic/OpenAI SDK,   402   ┌──────────────────────────────┐   WS (outbound)  idleproxy node
 or an MCP client       ─────► │ x402 verify → dispatch →     │ ◄──────────────  claude -p, throwaway
                        X-PAY  │ settle via KeeperHub →       │   dial-out       HOME, no host mounts
                        ─────► │ respond                      │
                                │                              │
                                │ SQLite: payments, jobs,      │
                                │ nodes, balances, payouts     │
                                └──────────┬───────────────────┘
                                           │ Direct Execution API (x402 settlement)
                                           │ MCP (treasurer agent → payout workflow)
                                           ▼
                                      KEEPERHUB
                          contract-call → transferWithAuthorization
                          Payout workflow: Webhook trigger → Check Treasury
                            Balance → Solvency Gate → Pay Provider
                          Solvency Watchdog: Block trigger → Check Balance →
                            Read Decimals → Condition
```

The **treasurer** is a real Claude Code agent with the KeeperHub MCP server attached — it calls
`execute_workflow` + `get_execution` to run payouts, not a cron job pretending to be one. See
[`SPEC.md` §3](./SPEC.md#3-actors).

## KeeperHub surfaces used

| Surface | Where |
|---|---|
| `POST /api/execute/contract-call` | x402 settlement — verify locally, settle via KeeperHub, so no transaction touches the chain outside it |
| Payout workflow (Webhook → `web3/check-token-balance` → Condition → `web3/transfer-token`) | Provider payouts — solvency check and transfer live in KeeperHub, not application code |
| Solvency Watchdog workflow (Block trigger → `web3/check-token-balance` → `web3/read-contract` → Condition) | Independent treasury monitoring |
| `GET /workflows/{id}/executions` | Pulled into `GET /api/audit` as the reconciliation alert surface (see note below) |
| MCP server, `kh_` header auth | The treasurer's hands — `execute_workflow`, `get_execution` |
| Gas Station sponsorship | Every settlement and payout is gasless for the org wallet |

**A confirmed platform limit, not an oversight:** `webhook/send-webhook`, the system `HTTP Request`
action, and `code/run-code` all return `upgrade_required` on this org's tier — tested directly, all
three. No KeeperHub action can make an outbound HTTP call on this plan, which is why the Solvency
Watchdog's "alert" is KeeperHub's own Executions API rather than a push notification, and why the
settlement-scheduling hook is driven by `idleproxy treasurer` rather than a KeeperHub Schedule
trigger. Full trail: [`docs/tx-links.md`](./docs/tx-links.md).

## Quickstart — provider

```bash
git clone <this repo> && cd idleproxy
npm install
cp .env.example .env   # fill in KEEPERHUB_API_KEY, KEEPERHUB_PAYOUT_WORKFLOW_ID
npx tsx src/cli.ts doctor    # checks claude, docker, KeeperHub, chain — all before you connect anything
npx tsx src/cli.ts serve     # router, on :8787 by default
```

Then open `http://localhost:8787`: connect wallet → sign → accept disclosure → set caps → copy the
generated `npx idleproxy node --wallet=... --token=...` command → run it. A fresh wallet reaches an
earning node in under a minute, with no config file hand-edited. Add `--tier1` to run the
containerized, tool-enabled tier instead of the tool-free default — it needs Docker and its own
disclosure opt-in.

## Quickstart — consumer

```bash
curl -X POST http://localhost:8787/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-code/sonnet","max_tokens":100,"messages":[{"role":"user","content":"hi"}]}'
# -> 402 with an x402 challenge; sign an EIP-3009 TransferWithAuthorization and retry with X-PAYMENT
```

Or skip per-call signing: `POST /api/keys` with an x402 payment mints an `ipx_sk_...` key with full
credit, then `x-api-key: ipx_sk_...` on `/v1/messages` never 402s — the path where "change one
environment variable and your existing SDK works" is literally true. `/v1/chat/completions` (OpenAI
shape) and `/mcp` (one tool, `relay_prompt`) are thin translators over the same settlement path.

## Mainnet

One env var. `CHAIN_ID`/`USDC_ADDRESS`/`EXPLORER_BASE` are read at boot; the EIP-712 domain
`name`/`version` are read live off the USDC contract, never hardcoded — the two chains' USDC
deployments don't share a domain, which is exactly why. Nothing in the source contains `84532` as a
literal. Deliberately not flipped for this submission: real money plus disclosed ToS exposure isn't a
hackathon posture.

## What honestly cannot work

Stated plainly, in full in [`SPEC.md` §12](./SPEC.md#12-what-honestly-cannot-work):

- **Real economic value.** Testnet units are worthless. This proves a mechanism, not an economy.
- **Model-identity proof.** Without a TEE, a provider's self-reported model is a signed claim, not
  cryptographic proof.
- **Prompt confidentiality.** The provider's machine sees plaintext to run the CLI. No fix at this
  architecture.
- **Upstream compliance.** Reselling subscription capacity is squarely what most providers' terms
  target. Testnet play-money and the provider running their own binary reduce exposure; they don't
  make this clearly compliant.

## Monolith

One `package.json`, one `tsconfig.json`, one SQLite file, no frontend build step, 18 source files.
Router, provider node, treasurer, and the bounty demo are subcommands of one binary
(`idleproxy serve | node | treasurer | doctor | facilitator-demo`). Full rationale:
[`SPEC.md` §4](./SPEC.md#4-repository-layout--monolith).

## Bounty: being your own x402 facilitator

```
npx tsx src/cli.ts facilitator-demo
```

Zero funding, zero setup: generates a throwaway wallet, signs a zero-value EIP-3009 authorization,
settles it through KeeperHub, prints a real transaction link. Tutorial:
[`docs/bounty/x402-facilitator.md`](./docs/bounty/x402-facilitator.md).
