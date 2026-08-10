---
description: Check KeeperHub MCP connection status and authentication.
allowed-tools: [Bash, Read]
---

<objective>
Show the current status of the KeeperHub MCP connection: whether the remote
server is reachable, authentication state, and available tools.
</objective>

<context>
KH_API_KEY env var set: !`[ -n "${KH_API_KEY:-}" ] && echo "YES" || echo "NO"`
</context>

<process>
1. **Check MCP connection**:
   - The plugin connects to `https://app.keeperhub.com/mcp` via HTTP MCP
   - If MCP tools (like `list_workflows`) are available in the current session, the connection is working
   - If not, the user needs to authorize via `/mcp`

2. **Check auth method**:
   - If KH_API_KEY env var is "YES": auth via API key
   - Otherwise: auth via OAuth (browser authorization)

3. **Present a status summary**:
   ```
   KeeperHub Status
   ----------------
   MCP Server:   app.keeperhub.com/mcp (remote)
   Connection:   [Connected / Not connected]
   Auth method:  [OAuth / API key / Not authenticated]
   ```

4. **Suggest next steps** if anything is wrong:
   - Not connected: run `/mcp` and authorize the keeperhub server
   - API key not working: verify the key starts with `kh_` and is not revoked
   - Need help: run `/keeperhub:login` for setup guidance
</process>

<success_criteria>
- Clear status summary displayed
- Connection state reported
- Actionable suggestions for any issues
</success_criteria>
