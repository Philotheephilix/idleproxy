<!-- source: https://docs.keeperhub.com/ai-tools/claude-code-plugin -->

# Claude Code Plugin

# Claude Code Plugin

[GitHub](https://github.com/KeeperHub/claude-plugins/tree/main/plugins/keeperhub) 

The KeeperHub plugin for Claude Code lets you create workflows, browse templates, debug executions, and explore plugins without leaving your terminal.

## Installation[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#installation)

There are two ways to connect Claude Code to KeeperHub:

### Option A: Remote MCP (no install needed)[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#option-a-remote-mcp-no-install-needed)

Connect directly to KeeperHub’s hosted MCP server. No CLI or plugin installation required.

```
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

Then run `/mcp` inside Claude Code to authorize via browser. That’s it.

### Option B: Plugin with local CLI[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#option-b-plugin-with-local-cli)

Install the plugin for skills, slash commands, and a local MCP server.

**1\. Install the `kh` CLI**

```
brew install keeperhub/tap/kh
```

See [CLI installation options](https://github.com/KeeperHub/cli#install)  for other platforms.

**2\. Install the plugin**

```
/plugin marketplace add KeeperHub/claude-plugins
/plugin install keeperhub@keeperhub-plugins
```

**3\. Restart Claude Code**

The plugin’s commands are registered on restart. Run them before that and Claude Code reports them as unknown commands.

**4\. Sign in**

```
/keeperhub:login
```

Run `/keeperhub:status` to confirm the connection.

### Requirements[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#requirements)

-   KeeperHub account at [app.keeperhub.com](https://app.keeperhub.com/) 
-   Option A: just a browser (for OAuth)
-   Option B: the `kh` CLI ([install instructions](https://github.com/KeeperHub/cli#install) )

### Which login is which[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#which-login-is-which)

Claude Code shows “Login expired, please run /login” about your Claude account, and `/login` is one of its own commands. Run `/login` inside Claude Code to sign back in.

Your KeeperHub connection is separate. Check it with `/keeperhub:status` and re-authorize it with `/mcp` or `/keeperhub:login`.

## Commands[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#commands)

### `/keeperhub:login`[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#keeperhublogin)

Setup guide for connecting to KeeperHub MCP. Walks you through running `/mcp` to authorize via browser, or setting up `KH_API_KEY` for headless/CI environments.

### `/keeperhub:status`[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#keeperhubstatus)

Check MCP connection status and authentication.

```
KeeperHub Status
----------------
MCP Server:   app.keeperhub.com/mcp (remote)
Connection:   Connected
Auth method:  OAuth
```

## Skills[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#skills)

Skills activate automatically based on what you ask Claude to do. No slash commands needed; just describe what you want.

### workflow-builder[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#workflow-builder)

**Activates when you say:** “create a workflow”, “monitor my wallet”, “set up automation”, “when X happens do Y”, “alert me when…”

Walks through building a workflow step by step:

1.  Identifies the trigger (what starts it)
2.  Discovers available actions via `list_action_schemas`
3.  Adds actions one at a time with your input
4.  Creates the workflow and offers to test it

**Example prompts:**

-   “Create a workflow that checks my vault health every 15 minutes and sends a Telegram alert if collateral drops below 150%”
-   “Monitor 0xABC… for large transfers and notify Discord”
-   “Set up a weekly reward distribution to stakers”

### template-browser[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#template-browser)

**Activates when you say:** “show me templates”, “find a workflow for…”, “deploy a template”, “what pre-built workflows exist”

Searches the template library, shows details, and deploys templates to your account with optional customization.

### execution-monitor[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#execution-monitor)

**Activates when you say:** “why did my workflow fail”, “check execution status”, “run my workflow”, “show logs”

Triggers workflows, polls for completion, and debugs failures by analyzing execution logs. Identifies the failing step, explains the error, and offers to fix the workflow.

### plugin-explorer[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#plugin-explorer)

**Activates when you say:** “what plugins are available”, “how do I use web3”, “show integrations”, “what actions can I use”

Lists available plugins and their actions, shows configured integrations, and validates plugin configurations.

## Configuration[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#configuration)

The plugin connects to KeeperHub’s remote MCP server at `app.keeperhub.com/mcp`. Authentication is handled via OAuth (browser) when you run `/mcp`, or via the `KH_API_KEY` environment variable for headless environments.

| Variable | Description |
| --- | --- |
| `KH_API_KEY` | API key for headless/CI environments (`kh_` prefix, organization-scoped) |

## Security[](https://docs.keeperhub.com/ai-tools/claude-code-plugin#security)

-   OAuth tokens are managed by Claude Code (automatic refresh)
-   API keys (`KH_API_KEY`) are only used in headless environments
-   All communication is over HTTPS
-   OAuth scopes restrict tool access (mcp:read, mcp:write, mcp:admin)
