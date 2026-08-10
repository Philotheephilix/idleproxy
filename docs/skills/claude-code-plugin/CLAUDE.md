# KeeperHub Plugin

This is a Claude Code plugin that connects to KeeperHub's remote MCP server for workflow automation.

## Architecture

- Pure markdown and JSON plugin (no executable code)
- Connects to remote MCP server at `app.keeperhub.com/mcp` via HTTP
- Authentication via OAuth 2.0 (browser) or API key (environment variable)

## Components

- **Skills**: 5 auto-invoked skills for workflow building, template browsing, execution monitoring, plugin exploration, and agentic wallet payments (`keeperhub-wallet`, vendored from `@keeperhub/wallet`)
- **Commands**: 2 slash commands for login setup and status checking
- **MCP Server**: Remote HTTP connection configured in `.mcp.json`

## Key Patterns

- All skills check authentication before making API calls
- Skills route to each other for out-of-scope requests
- Progressive disclosure: start simple, add complexity only when needed
