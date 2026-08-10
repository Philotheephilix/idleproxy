# Implementing on KeeperHub — condensed build guide

Shortest path from zero to "my agent executed a real transaction onchain through KeeperHub",
which is exactly what the hackathon judges on. Every claim here links to the mirrored page that
backs it — read that page before relying on a detail.

---

## 1. Pick a surface

KeeperHub exposes four ways in. They hit the same platform; pick by what you are building.

| Surface | Use when | Entry point |
|---|---|---|
| **MCP server** (recommended for agents) | Your agent is an LLM client (Claude Code/Desktop, Cursor, Cline, …) | `https://app.keeperhub.com/mcp` — [`keeperhub/ai-tools/mcp-server.md`](./keeperhub/ai-tools/mcp-server.md) |
| **REST API** | Backend service, ops script, CI, non-agent integration | Base `https://app.keeperhub.com`, paths already include `/api` — [`keeperhub/api.md`](./keeperhub/api.md). Note `api/openapi.json` covers **marketplace calls only**; direct execution is documented in [`keeperhub/api/direct-execution.md`](./keeperhub/api/direct-execution.md) |
| **`kh` CLI** | Shell, CI, quick manual proof | `brew install keeperhub/tap/kh` — [`keeperhub/cli/quickstart.md`](./keeperhub/cli/quickstart.md) |
| **Framework plugins** | Hermes (Python), Vercel Eve (TS), or the shared MCP client foundation | [`repos/hermes-plugin.README.md`](./repos/hermes-plugin.README.md), [`repos/eve-plugin.README.md`](./repos/eve-plugin.README.md), [`repos/mcp.README.md`](./repos/mcp.README.md) |

Also: `@keeperhub/sdk` (typed REST client, `0.x`) — [`repos/sdk.README.md`](./repos/sdk.README.md).

**Base-URL trap:** set the client base to `https://app.keeperhub.com`, *not*
`.../api`. Doubling gives a self-describing 404 with `error: "doubled_api_prefix"`.

## 2. Authenticate

| Method | Scope |
|---|---|
| API key `kh_…` (Bearer) | Org-scoped endpoints: workflows, integrations, billing, org management. **Not** accepted on user-account, wallet-write, OAuth-bound, or per-user endpoints. Create at app.keeperhub.com → Settings → API Keys → Organisation. |
| Session (Better Auth cookies) | Every endpoint. Browser flow, or headless via SIWE. |
| OAuth 2.1 | MCP only — 1h access tokens, 30d refresh, discovered at `/.well-known/oauth-authorization-server`. |

Fully headless (agent/CI, no browser, no captcha): SIWE with an EOA key —
`POST /api/auth/siwe/nonce` → `POST /api/auth/siwe/verify` → `POST /api/keys` (twice; the first
returns a challenge to sign) → `GET /api/user` for the `walletAddress` to fund. Keep the
`Set-Cookie` values and send an `Origin` header on every cookie-bearing mutation, else `403`.
Full script: [`keeperhub/api/headless-onboarding.md`](./keeperhub/api/headless-onboarding.md).

Each MCP connection is scoped to exactly one org — one server entry per org if you need several.

## 3. Wire the MCP server (agent path)

```bash
# OAuth (interactive)
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
# headless
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_your_key_here"
```

Optionally add the Claude Code plugin for skills + slash commands on top —
source is vendored at [`skills/claude-code-plugin/`](./skills/claude-code-plugin/)
(skills: `workflow-builder`, `plugin-explorer`, `execution-monitor`, `template-browser`,
`keeperhub-wallet`; commands: `/login`, `/status`).

30+ tools. Call `tools_documentation` or `list_action_schemas` at runtime for the authoritative
set. The ones that matter for the hackathon:

- Direct onchain: `execute_transfer`, `execute_contract_call`, `execute_check_and_execute`,
  `get_direct_execution_status`
- Workflows: `create_workflow`, `validate_workflow`, `execute_workflow`, `get_execution`
- Discovery: `list_action_schemas`, `search_protocol_actions`, `execute_protocol_action`
- Marketplace: `search_workflows`, `call_workflow`, `list_workflow`

Per-workflow MCP servers at `https://app.keeperhub.com/mcp/w/<slug>` register a single typed tool
with the workflow's real input schema — better LLM tool-selection accuracy than the generic
`call_workflow` dispatcher.

## 4. Execute something onchain

Two models, both produce a transaction hash.

**A. Direct execution** — one HTTP call, synchronous, no workflow graph needed.
Full reference: [`keeperhub/api/direct-execution.md`](./keeperhub/api/direct-execution.md).

```
POST /api/execute/transfer          # native or ERC-20
POST /api/execute/contract-call     # any contract function
POST /api/execute/check-and-execute # read → condition → act
GET  /api/execute/{executionId}/status
```

```json
{
  "chainId": 11155111,
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "amount": "0.1",
  "tokenAddress": "0x1c7D...",
  "gasLimitMultiplier": "1.2"
}
```

Returns `202` with `{executionId, status, transactionHash, transactionLink}`.

**B. Workflows** — a directed graph of nodes. Trigger (`Manual`, `Schedule`, `Webhook`, `Event`,
`Block`) + action nodes from plugins, connected by edges. Values flow between nodes with
`{{@nodeId:Label.field}}`. One run = an execution with status, logs, metrics.
See [`keeperhub/workflows.md`](./keeperhub/workflows.md),
[`keeperhub/workflows/schema-reference.md`](./keeperhub/workflows/schema-reference.md),
[`keeperhub/keepers/configuration.md`](./keeperhub/keepers/configuration.md).

Web3 actions:

| Read (no wallet) | Write (needs org wallet integration) |
|---|---|
| `web3/check-balance` | `web3/transfer-funds` |
| `web3/check-token-balance` | `web3/transfer-token` |
| `web3/read-contract` | `web3/write-contract` |

`network` takes chain IDs as strings. Edges out of a Condition node need
`sourceHandle: "true"`/`"false"`; out of a For Each node, `"loop"`/`"done"`.

### The safe first-write sequence — do this, judges reward it

1. `GET /api/chains`, pick one where `isEnabled` and `isTestnet` are both `true`.
2. Call the write with `simulate: true` (JSON boolean, not `"true"`). Estimates gas, catches a
   revert, signs nothing, broadcasts nothing, returns no tx hash.
3. If `success: true` and `wouldRevert: false`, repeat the identical call without `simulate` and
   **with a unique `idempotency_key`**.
4. Poll `GET /api/execute/{executionId}/status` with bounded backoff, honoring the
   `X-Poll-Interval-Hint` header, until `completed` or `failed`.

Simulation is EVM-only — Solana (`101`, `103`) rejects `simulate: true`.

**Gotchas that will eat your demo:**

- `recipientAddress` is EIP-55 checksum-validated. Pass exact checksummed or all-lowercase; a
  mixed-case address with a bad checksum is rejected outright.
- **Sponsored executions** (gas-sponsored, relayer or EIP-7702 path) do not touch your EOA's nonce
  or balance and never appear in a block explorer's `txlist` for that address. Check the
  `sponsored` field; treat `transactionHash`/`transactionLink` as the only proof.
- A `409` on retry with a non-null `originalExecutionId` is an answer, not an error — poll that id.

Chain aliases → ids: `mainnet`/`ethereum` 1, `sepolia` 11155111, `base` 8453, `base-sepolia` 84532,
`tempo` 4217, `tempo-testnet` 42431, `solana` 101, `solana-devnet` 103.
Verified ABIs: `GET /api/chains/{chainId}/abi?address={contractAddress}`.

## 5. Wallets, payments, x402 / MPP

- **Org wallet** (Para MPC) backs workflow/direct writes — [`keeperhub/wallet-management.md`](./keeperhub/wallet-management.md).
- **Agentic wallet** is what your agent uses to *pay* for paid workflows. Server-side Turnkey
  custody, no private key on disk; a `PreToolUse` hook gates every signature against
  `~/.keeperhub/safety.json` (auto ≤ `auto_approve_max_usd`, ask, block).

```bash
npx -p @keeperhub/wallet keeperhub-wallet skill install
npx -p @keeperhub/wallet keeperhub-wallet add
```

Settlement: x402 on Base USDC (`0x8335…2913`) or MPP on Tempo USDC.e (`0x20C0…8b50`), both via
EIP-3009-style pre-signed authorisations — the facilitator pays gas, only the USDC amount leaves
your wallet. Turnkey-enforced hard limits you cannot edit away: those two contracts only, ≤100 USDC
per transfer/approval, chain ids 8453/4217/42431 only, 200 USDC per UTC day
(`429 DAILY_CAP_EXCEEDED`). Paid workflows answer `402` with a challenge; the wallet hook intercepts,
signs, retries. Details + alternatives (agentcash, Coinbase skills):
[`keeperhub/ai-tools/agentic-wallet.md`](./keeperhub/ai-tools/agentic-wallet.md), skill file at
[`skills/keeperhub-wallet.skill.md`](./skills/keeperhub-wallet.skill.md).

## 6. Reliability and observability — a judging criterion, not a nicety

Criterion 3 is explicit about retries, gas handling, and audit-trail usage. Cheap things that show it:

- Simulate before every write; log the simulation result next to the eventual receipt.
- Idempotency keys on every broadcast, and handle the `409` replay path.
- Bounded backoff polling that honors `X-Poll-Interval-Hint`.
- Surface the KeeperHub audit trail (trigger → simulation → submitted tx → gas used → outcome →
  timestamp) in your UI or logs — [`keeperhub/keeper-runs.md`](./keeperhub/keeper-runs.md).
- Read [`keeperhub/practices.md`](./keeperhub/practices.md) before you freeze the design.

## 7. Ecosystem you can lean on

14 DeFi protocol plugins (Aave V3, Aerodrome, Ajna, Chainlink, Compound V3, CoW Swap, Curve, Lido,
Morpho, Pendle, Rocket Pool, Sky, Spark, Uniswap), plus `web3`, `code` (JS steps), `math`, `safe`,
and notifiers (Discord, Telegram, SendGrid, Webhook) — [`keeperhub/plugins/`](./keeperhub/plugins/).
The `web3` plugin auto-detects EIP-1967/1822/Diamond proxies and auto-fetches verified ABIs.

Templates: `search_templates` / `deploy_template`, or `kh template deploy`.

## 8. Deliverables checklist

- [ ] Public GitHub repo
- [ ] Demo video showing the agent executing onchain **through KeeperHub**
- [ ] Link to a real transaction the agent executed via KeeperHub
- [ ] Submitted on DoraHacks before **2026-08-13 12:00 UTC+2**

Optional second shot at money: the $1,000 **Best Onboarding UX Improvement** bounty stacks with the
grand prize — a merged PR to KeeperHub, a starter template, a tutorial, or a documented teardown of
where you got stuck. Full rules: [`hackathon/README.md`](./hackathon/README.md).
