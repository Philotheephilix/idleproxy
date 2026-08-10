---
name: workflow-builder
description: |
  Help users create KeeperHub workflows from natural language descriptions.
  Activate when users want to build automations, monitor contracts, set up
  alerts, or create workflow pipelines.
---

<objective>
Guide users through creating KeeperHub workflows using the MCP tools. Translate
natural language descriptions into structured workflow configurations with triggers,
actions, and connections. Use progressive disclosure -- start simple and add
complexity only when needed.
</objective>

<trigger_conditions>
Activate when ANY of these are true:
- User says "create a workflow", "build a workflow", "make a workflow", or "new workflow"
- User wants to "monitor" a contract, API endpoint, or data source
- User says "set up automation", "automate", or "when X happens do Y"
- User says "alert me when", "notify me when", or "watch for"
- User describes a pipeline like "check status then notify" or "check condition and send alert"
- User mentions specific KeeperHub actions like "read contract", "send webhook", "discord notification"
</trigger_conditions>

<do_not_trigger>
Do NOT activate when:
- User is asking about workflows conceptually without wanting to build one
- User is debugging an existing workflow (use execution-monitor skill instead)
- User is browsing templates (use template-browser skill instead)
- User is asking about available plugins (use plugin-explorer skill instead)
- User is working on code unrelated to KeeperHub
</do_not_trigger>

<process>
1. **Check authentication** before doing anything:
   - Check if KeeperHub MCP tools are available (connection is active) or if `KH_API_KEY` env var is set
   - If not authenticated, tell the user: "You need to authenticate first. Run `/keeperhub:login` to set up."
   - Do not proceed until auth is confirmed

2. **Understand the user's intent**:
   - Ask clarifying questions if the request is vague
   - Identify the trigger (what starts the workflow)
   - Identify the actions (what happens)
   - Identify the conditions (any filters or logic)

3. **Discover available actions**:
   - Use `list_action_schemas` to get the available action types
   - Match the user's intent to specific action schemas
   - If the user mentions a specific integration (e.g., Discord, SendGrid), search for its actions

4. **Build the workflow progressively**:
   - Start with the trigger configuration
   - Add actions one at a time, confirming each with the user
   - For each action, show the required fields from the schema
   - Connect nodes in the correct order
   - For complex requests, consider using `ai_generate_workflow` to delegate to
     KeeperHub's AI service, then review and refine the result with the user

5. **Create the workflow**:
   - Use `create_workflow` with the assembled configuration
   - The workflow needs: name, description, trigger, nodes (actions), and edges (connections)
   - Present the created workflow summary to the user

6. **Offer next steps**:
   - "Want to test it?" -- use `execute_workflow`
   - "Want to modify it?" -- use `update_workflow`
   - "Want to delete it?" -- use `delete_workflow`
   - "Want to see similar templates?" -- use `search_templates`

**Workflow structure reference**:
```json
{
  "name": "Workflow name",
  "description": "What it does",
  "trigger": {
    "type": "manual|schedule|webhook|event",
    "config": {}
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "action-type",
      "config": {}
    }
  ],
  "edges": [
    { "source": "trigger", "target": "node-1" }
  ]
}
```

**MCP tools used in this skill**:
- `list_action_schemas` -- discover available actions and their fields
- `ai_generate_workflow` -- delegate complex workflow generation to KeeperHub AI
- `create_workflow` -- create the workflow
- `update_workflow` -- modify an existing workflow
- `delete_workflow` -- remove a workflow
- `execute_workflow` -- test the workflow
- `search_plugins` -- find plugins for specific integrations
- `get_plugin` -- get plugin documentation
- `validate_plugin_config` -- validate action configuration
</process>

<success_criteria>
- Auth verified before any API calls
- User's intent clearly understood before building
- Workflow created successfully via `create_workflow`
- Each action's required fields filled in correctly
- User shown a summary of what was created
- Next steps offered (test, modify, find templates)
</success_criteria>
