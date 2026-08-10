# KeeperHub Claude Code Plugins

Claude Code plugin marketplace by KeeperHub.

## Setup

```
/plugin marketplace add KeeperHub/claude-plugins
/plugin install keeperhub@keeperhub-plugins
/keeperhub:login
```

Run `/keeperhub:status` to verify the connection.

## Plugins

**keeperhub**

Build and manage automation workflows from Claude Code. Monitor smart contracts, track on-chain events, run scheduled tasks, and send notifications across Discord, Telegram, email, and webhooks. Connects to KeeperHub's remote MCP server with OAuth browser authentication.

**Try it:**

- "Create a workflow that monitors a smart contract event and sends a Telegram alert"
- "Show me workflow templates for on-chain monitoring"
- "Why did my last workflow fail?"
- "What KeeperHub plugins are available?"

**Commands:** `/keeperhub:login` | `/keeperhub:status`

**Skills (activate automatically):**

- **workflow-builder** -- create workflows from natural language
- **template-browser** -- browse and deploy pre-built templates
- **execution-monitor** -- monitor runs and debug failures
- **plugin-explorer** -- discover available plugins and integrations
