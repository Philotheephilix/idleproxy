<!-- source: https://docs.keeperhub.com/cli/commands/kh_workflow_delete -->

# Kh Workflow Delete - KeeperHub Docs

## kh workflow delete[](https://docs.keeperhub.com/cli/commands/kh_workflow_delete#kh-workflow-delete)

Delete a workflow

```
kh workflow delete <workflow-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_workflow_delete#examples)

```
  # Delete a workflow (will prompt for confirmation)
  kh wf delete abc123

  # Delete without prompting
  kh wf delete abc123 --yes

  # Force delete a workflow that has execution history
  kh wf delete abc123 --force
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_workflow_delete#options)

```
      --force   Force delete even if workflow has execution history
  -h, --help    help for delete
  -y, --yes     Skip confirmation prompt
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_workflow_delete#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_workflow_delete#see-also)

-   [kh workflow](https://docs.keeperhub.com/cli/commands/kh_workflow) - Manage workflows
