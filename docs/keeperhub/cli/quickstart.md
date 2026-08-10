<!-- source: https://docs.keeperhub.com/cli/quickstart -->

# Quickstart

# Quickstart

## Install[](https://docs.keeperhub.com/cli/quickstart#install)

**Homebrew (macOS/Linux):**

```
brew install keeperhub/tap/kh
```

**Go install:**

```
go install github.com/keeperhub/cli/cmd/kh@latest
```

**Binary download:** Download from [GitHub Releases](https://github.com/keeperhub/cli/releases)  and add to your PATH.

## Authenticate[](https://docs.keeperhub.com/cli/quickstart#authenticate)

```
kh auth login
```

This opens a browser window to authenticate. Your token is stored in the OS keyring.

To authenticate non-interactively (CI/CD), set `KH_API_KEY` instead.

## Common Commands[](https://docs.keeperhub.com/cli/quickstart#common-commands)

**List workflows:**

```
kh workflow list
```

**Run a workflow and wait for completion:**

```
kh workflow run <workflow-id> --wait
```

**Check a run’s status:**

```
kh run status <run-id>
```

**View run logs:**

```
kh run logs <run-id>
```

**Execute a contract call:**

```
kh execute contract-call --protocol aave --action supply --args '{"amount":"1000000"}'
```

**List available protocols:**

```
kh protocol list
```

## MCP Server Mode[](https://docs.keeperhub.com/cli/quickstart#mcp-server-mode)

KeeperHub exposes its actions as tools to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/) .

**Recommended: remote HTTP endpoint (no local server required):**

```
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

**Add to Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```
{ "mcpServers": { "keeperhub": { "type": "http", "url": "https://app.keeperhub.com/mcp" } } }
```

Restart Claude Desktop. KeeperHub tools will appear in the tool list.

**Legacy: local stdio server (deprecated):**

`kh serve --mcp` starts a local MCP stdio server. This mode is deprecated. Prefer the remote HTTP endpoint above.

## Next Steps[](https://docs.keeperhub.com/cli/quickstart#next-steps)

-   [Concepts](https://docs.keeperhub.com/cli/concepts) — authentication, output formats, configuration
-   [Command reference](https://docs.keeperhub.com/cli/commands/kh) — full documentation for every command
