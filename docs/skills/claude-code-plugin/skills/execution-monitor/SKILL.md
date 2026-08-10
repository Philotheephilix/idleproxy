---
name: execution-monitor
description: |
  Monitor and debug KeeperHub workflow executions. Activate when users ask about
  execution status, want to see logs, or need help debugging failed workflows.
---

<objective>
Help users monitor workflow executions, check status, read logs, and debug failures.
Provide clear explanations of what happened and actionable suggestions for fixing issues.
</objective>

<trigger_conditions>
Activate when ANY of these are true:
- User says "check execution", "execution status", or "is my workflow running"
- User says "why did my workflow fail", "workflow failed", or "debug workflow"
- User says "show execution logs", "show logs", or "what happened"
- User says "run my workflow", "execute workflow", or "trigger workflow"
- User asks about a specific workflow's recent activity
</trigger_conditions>

<do_not_trigger>
Do NOT activate when:
- User is creating or editing a workflow (use workflow-builder skill)
- User is browsing templates (use template-browser skill)
- User is asking general questions about KeeperHub capabilities
- User is working on code unrelated to KeeperHub
</do_not_trigger>

<process>
1. **Check authentication** before doing anything:
   - Check if KeeperHub MCP tools are available (connection is active) or if `KH_API_KEY` env var is set
   - If not authenticated, tell the user: "You need to authenticate first. Run `/keeperhub:login` to set up."
   - Do not proceed until auth is confirmed

2. **Identify the workflow**:
   - If the user provides a workflow name or ID, use it directly
   - If not, use `list_workflows` to show available workflows and ask which one
   - Use `get_workflow` to confirm the correct workflow

3. **For execution requests** ("run my workflow"):
   - Use `execute_workflow` to trigger the workflow
   - Use `get_execution_status` to poll for completion
   - Report the final status

4. **For status checks** ("is it running", "check status"):
   - Use `get_execution_status` with the workflow or execution ID
   - Report: status (running/completed/failed), start time, duration
   - If still running, offer to check again later

5. **For debugging** ("why did it fail", "show logs"):
   - Use `get_execution_logs` to get detailed step-by-step logs
   - Identify the failing step and the error message
   - Analyze the error and provide a clear explanation:
     - Configuration errors: suggest specific config changes
     - Auth errors: suggest checking integrations
     - Network errors: suggest retry or checking endpoints
     - Logic errors: suggest workflow modifications
   - Offer to fix the issue if it can be resolved via `update_workflow`

6. **Present results clearly**:
   - For successful runs: show output summary
   - For failures: show which step failed, the error, and suggested fix
   - For in-progress runs: show current step and elapsed time

**MCP tools used in this skill**:
- `list_workflows` -- find the workflow to monitor
- `get_workflow` -- get workflow details
- `execute_workflow` -- manually trigger a workflow
- `get_execution_status` -- check execution status
- `get_execution_logs` -- get detailed execution logs
- `update_workflow` -- fix issues in the workflow
</process>

<success_criteria>
- Auth verified before any API calls
- Correct workflow identified
- Status or logs retrieved and presented clearly
- Failures explained with actionable suggestions
- Offered to fix issues when possible
</success_criteria>
