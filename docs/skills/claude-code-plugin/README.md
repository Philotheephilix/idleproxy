# KeeperHub Plugin for Claude Code

Build and manage automation workflows from Claude Code. Monitor smart contracts, track on-chain events, configure scheduled tasks, and connect notifications across Discord, Telegram, email, and webhooks.

## Quick Start

```
/plugin marketplace add KeeperHub/claude-plugins
/plugin install keeperhub@keeperhub-plugins
/keeperhub:login
```

For headless/CI environments, set `KH_API_KEY` with an organization API key (`kh_` prefix) instead.

Run `/keeperhub:status` to verify, then try "create a workflow that monitors a smart contract event".

## Commands

| Command | Description |
|---------|-------------|
| `/keeperhub:login` | Setup guide for connecting to KeeperHub MCP |
| `/keeperhub:status` | Check MCP connection status and authentication |

## Skills

- **workflow-builder** -- Create workflows from natural language. Triggered by "create a workflow", "monitor contract", "set up automation".
- **template-browser** -- Browse and deploy pre-built workflow templates. Triggered by "show templates", "find a workflow for".
- **execution-monitor** -- Monitor executions and debug failures. Triggered by "check execution", "why did my workflow fail".
- **plugin-explorer** -- Discover available plugins and integrations. Triggered by "what plugins are available", "show integrations".
- **keeperhub-wallet** -- Pay for KeeperHub marketplace workflows and any x402 / MPP 402 endpoint via a server-proxied Turnkey wallet (Base USDC + Tempo USDC.e). Triggered by "pay for keeperhub workflow", "call paid keeperhub workflow", "fund keeperhub wallet". To actually transact, provision a wallet and register the `PreToolUse` safety hook with a one-time `npx -p @keeperhub/wallet keeperhub-wallet skill install` after installing this plugin.

## MCP Server

This plugin connects to KeeperHub's remote MCP server at `app.keeperhub.com/mcp` via HTTP. Authentication is handled via OAuth (browser) or API key (headless). No local CLI or process needed.

See the [MCP server documentation](https://docs.keeperhub.com/ai-tools/mcp-server) for details on available tools.

## Requirements

- A KeeperHub account at https://app.keeperhub.com
- A browser (for OAuth authorization)

## Privacy

See our [Privacy Policy](https://keeperhub.com/privacy) for details on how data is handled.
