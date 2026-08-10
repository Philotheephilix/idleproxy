---
name: template-browser
description: |
  Browse and deploy pre-built KeeperHub workflow templates. Activate when users
  want to find existing automations or deploy ready-made templates rather than
  building from scratch.
---

<objective>
Help users discover and deploy pre-built workflow templates from the KeeperHub
template library. Search by use case, filter by category, show template details,
and deploy templates to the user's account.
</objective>

<trigger_conditions>
Activate when ANY of these are true:
- User says "show me templates", "browse templates", or "find a template"
- User says "find a workflow for" or "is there a template for"
- User says "deploy a template" or "use a template"
- User says "what automations are available" or "what pre-built workflows exist"
- User asks for a specific use case and a template would be faster than building from scratch
</trigger_conditions>

<do_not_trigger>
Do NOT activate when:
- User explicitly wants to build a custom workflow from scratch
- User is asking about their own existing workflows
- User is debugging or monitoring an execution
- User is exploring plugins or integrations without wanting a template
</do_not_trigger>

<process>
1. **Check authentication** before doing anything:
   - Check if KeeperHub MCP tools are available (connection is active) or if `KH_API_KEY` env var is set
   - If not authenticated, tell the user: "You need to authenticate first. Run `/keeperhub:login` to set up."
   - Do not proceed until auth is confirmed

2. **Search for templates**:
   - Use `search_templates` with the user's query or category
   - Present results as a concise list: name, description, category
   - If no results, suggest related search terms or offer to build a custom workflow instead

3. **Show template details** when the user picks one:
   - Use `get_template` to fetch full metadata
   - Present: name, description, what it does, required integrations, trigger type, actions involved
   - Highlight any prerequisites (e.g., "requires Discord integration" or "needs an API key configured")

4. **Deploy the template** when the user confirms:
   - Use `deploy_template` to create the workflow from the template
   - Report success with the new workflow name and ID
   - Mention any configuration the user still needs to fill in (API keys, addresses, etc.)

5. **Offer next steps**:
   - "Want to customize it?" -- use `update_workflow` via the workflow-builder skill
   - "Want to test it?" -- use `execute_workflow`
   - "Want to see more templates?" -- search again

**MCP tools used in this skill**:
- `search_templates` -- find templates by query or category
- `get_template` -- get full template metadata and configuration
- `deploy_template` -- deploy a template to the user's account
- `update_workflow` -- customize a deployed template
- `execute_workflow` -- test the deployed workflow
</process>

<success_criteria>
- Auth verified before any API calls
- Templates presented in a scannable format
- Template details shown before deployment
- Prerequisites and required configuration highlighted
- Template deployed successfully if requested
- Next steps offered after deployment
</success_criteria>
