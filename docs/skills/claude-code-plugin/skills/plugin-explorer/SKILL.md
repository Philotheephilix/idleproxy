---
name: plugin-explorer
description: |
  Explore available KeeperHub plugins and integrations. Help users discover what
  actions are available, how to configure them, and what integrations are set up.
---

<objective>
Help users discover what KeeperHub can do by exploring available plugins, actions,
and integrations. Show what is available, how to configure each action, and what
integrations the user already has connected.
</objective>

<trigger_conditions>
Activate when ANY of these are true:
- User says "what plugins are available", "show plugins", or "list plugins"
- User says "show integrations", "what integrations do I have", or "list integrations"
- User says "how do I use" followed by a plugin name (notifications, discord, sendgrid, webhook)
- User says "what can KeeperHub do", "what actions are available", or "what are my options"
- User asks about a specific action type or capability
- User wants to validate a plugin configuration before using it in a workflow
</trigger_conditions>

<do_not_trigger>
Do NOT activate when:
- User is actively building a workflow (use workflow-builder skill)
- User is looking for templates (use template-browser skill)
- User is debugging an execution (use execution-monitor skill)
- User is asking about non-KeeperHub tools or services
</do_not_trigger>

<process>
1. **Check authentication** before doing anything:
   - Check if KeeperHub MCP tools are available (connection is active) or if `KH_API_KEY` env var is set
   - If not authenticated, tell the user: "You need to authenticate first. Run `/keeperhub:login` to set up."
   - Do not proceed until auth is confirmed

2. **For general exploration** ("what can KeeperHub do", "what plugins"):
   - Use `search_plugins` to list available plugins
   - Present a summary: plugin name, description, number of actions
   - Group by category if helpful (monitoring, notifications, utilities)

3. **For specific plugin details** ("how do I use web3"):
   - Use `get_plugin` to get full documentation
   - Use `list_action_schemas` to show available actions for that plugin
   - Present: action names, descriptions, required fields, optional fields
   - Include configuration examples

4. **For integration status** ("what integrations do I have"):
   - Use `list_integrations` to show configured integrations
   - Highlight which integrations are active vs. need setup
   - Suggest plugins that would work with existing integrations

5. **For configuration validation** ("is this config correct"):
   - Use `validate_plugin_config` with the user's configuration
   - Report any errors or missing fields
   - Suggest corrections

6. **Offer next steps**:
   - "Want to build a workflow with this plugin?" -- transition to workflow-builder skill
   - "Want to see templates using this plugin?" -- transition to template-browser skill
   - "Need to set up an integration?" -- point to KeeperHub settings

**MCP tools used in this skill**:
- `search_plugins` -- find plugins by name or category
- `get_plugin` -- get full plugin documentation
- `list_action_schemas` -- list available actions and their schemas
- `list_integrations` -- show configured integrations
- `validate_plugin_config` -- validate action configuration
- `tools_documentation` -- get MCP tool documentation
</process>

<success_criteria>
- Auth verified before any API calls
- Available plugins and actions presented clearly
- Configuration details shown with examples
- Integration status reported accurately
- Smooth transition to other skills when user wants to act
</success_criteria>
