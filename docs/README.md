# idleproxy — docs

Full offline context for the **KeeperHub — Agents Onchain Hackathon** (DoraHacks), plus everything
needed to build against KeeperHub.

Scraped 2026-08-09. Sources: `dorahacks.io/hackathon/agents-onchain`, `docs.keeperhub.com`,
`app.keeperhub.com/api/openapi`, `github.com/KeeperHub/*`.

## Layout

| Path | What |
|---|---|
| [`hackathon/`](./hackathon/README.md) | The hackathon brief: rules, prizes, timeline, judging criteria, submission checklist. Plus the raw page scrape. |
| [`keeperhub/`](./keeperhub/) | Mirror of the entire `docs.keeperhub.com` site — 173 pages as markdown, same URL structure. Start at [`intro/overview.md`](./keeperhub/intro/overview.md). |
| [`keeperhub/llms.txt`](./keeperhub/llms.txt) | KeeperHub's own machine-readable site map — best single-file orientation. |
| [`keeperhub/_index.json`](./keeperhub/_index.json) | url → local path → title index for every mirrored page. |
| [`api/openapi.json`](./api/openapi.json) | OpenAPI 3.1 spec — **marketplace only**: all 110 paths are `POST /api/mcp/workflows/{slug}/call`. It contains **no** `/api/execute/*` endpoints. The direct-execution contract lives in [`keeperhub/api/direct-execution.md`](./keeperhub/api/direct-execution.md), not here. |
| [`skills/`](./skills/) | Agent skills: the KeeperHub Claude Code plugin (5 skills + 2 commands + MCP config) and the agentic-wallet skill. |
| [`repos/`](./repos/) | READMEs for every KeeperHub GitHub repo (SDK, CLI, MCP adapters, agentic wallet, Hermes/Eve plugins). |
| [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) | Condensed build guide — the shortest path from zero to an onchain transaction through KeeperHub. |
| [`validation/`](./validation/) | Two independent agent reviews of our project idea: [technical](./validation/technical-validation.md) (ToS, x402 mechanics, trust model) and [sponsor-fit](./validation/sponsor-fit.md) (qualification, judging, demo, timeline). |

Our own project spec and build plan live one level up: [`../SPEC.md`](../SPEC.md) and
[`../PLAN.md`](../PLAN.md).

## The one requirement

Every hackathon submission must use **KeeperHub as its onchain execution layer**, and must link a
real transaction the agent executed through it. Agent framework choice is free.

## Key doc entry points

- Concepts / data model — [`keeperhub/intro/concepts.md`](./keeperhub/intro/concepts.md)
- Getting started — [`keeperhub/getting-started/quickstart.md`](./keeperhub/getting-started/quickstart.md)
- **MCP server** (agent surface) — [`keeperhub/ai-tools/mcp-server.md`](./keeperhub/ai-tools/mcp-server.md)
- **Agentic wallets** (x402 / MPP) — [`keeperhub/ai-tools/agentic-wallet.md`](./keeperhub/ai-tools/agentic-wallet.md)
- Claude Code plugin — [`keeperhub/ai-tools/claude-code-plugin.md`](./keeperhub/ai-tools/claude-code-plugin.md)
- Direct onchain execution — [`keeperhub/api/direct-execution.md`](./keeperhub/api/direct-execution.md)
- REST API overview — [`keeperhub/api.md`](./keeperhub/api.md) · auth — [`keeperhub/api/authentication.md`](./keeperhub/api/authentication.md)
- CLI — [`keeperhub/cli/quickstart.md`](./keeperhub/cli/quickstart.md) · every `kh` subcommand under [`keeperhub/cli/commands/`](./keeperhub/cli/commands/)
- Workflow nodes — [`keeperhub/keepers/overview.md`](./keeperhub/keepers/overview.md), [`keeperhub/keepers/configuration.md`](./keeperhub/keepers/configuration.md)
- Plugins (web3, code, math, Safe, 14 DeFi protocols, 4 notifiers) — [`keeperhub/plugins/`](./keeperhub/plugins/)
- Runs / observability — [`keeperhub/keeper-runs.md`](./keeperhub/keeper-runs.md)
- Wallets & gas — [`keeperhub/wallet-management.md`](./keeperhub/wallet-management.md)
- Best practices — [`keeperhub/practices.md`](./keeperhub/practices.md) · FAQ — [`keeperhub/FAQ.md`](./keeperhub/FAQ.md)

## Live links

- Hackathon: https://dorahacks.io/hackathon/agents-onchain/detail
- Docs: https://docs.keeperhub.com/ · App: https://app.keeperhub.com
- Discord (office hours): https://discord.gg/keeperhub · Links: https://keeperhub.com/links
- GitHub org: https://github.com/KeeperHub
