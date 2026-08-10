---
description: Connect to KeeperHub MCP. Authorize via browser or set an API key for headless environments.
allowed-tools: [Bash, Read]
---

<objective>
Help the user connect to the KeeperHub MCP server by:
1. Checking if MCP tools are already available
2. Guiding them through OAuth authorization via /mcp
3. Or setting up an API key for headless environments
</objective>

<context>
KH_API_KEY env var set: !`[ -n "${KH_API_KEY:-}" ] && echo "YES" || echo "NO"`
</context>

<process>
1. **Check if already connected**:
   - If KH_API_KEY env var is "YES", the user has an API key configured
   - Tell them MCP tools should be available. Suggest running `/keeperhub:status` to verify.
   - If tools are working, skip to step 4

2. **Guide OAuth authorization**:
   - The plugin is configured to connect to `https://app.keeperhub.com/mcp`
   - Tell the user:
     a. Run `/mcp` in Claude Code
     b. Find "keeperhub" in the MCP server list
     c. Click to authorize. This opens a browser for OAuth consent.
     d. Approve access in the browser
     e. Return to Claude Code. MCP tools should now be available.

3. **Headless/CI fallback** (if browser auth is not possible):
   - Tell the user to create an organization API key:
     a. Log in to https://app.keeperhub.com
     b. Click avatar > API Keys > Organisation tab > New API Key
     c. Copy the key (starts with `kh_`, shown only once)
   - Set the environment variable:
     ```
     KH_API_KEY=kh_your_key_here
     ```
   - Restart Claude Code for the key to take effect

4. **Report status**:
   - Show a summary:
     ```
     KeeperHub Setup Complete
     ------------------------
     MCP Server: app.keeperhub.com/mcp (remote)
     Auth:       [OAuth / API key]
     ```
   - Suggest trying: "Create a workflow that monitors a smart contract event"
</process>

<success_criteria>
- User is connected to KeeperHub MCP (tools available)
- User informed how to verify with /keeperhub:status
</success_criteria>
