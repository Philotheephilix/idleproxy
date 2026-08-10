<!-- source: https://docs.keeperhub.com/cli/commands/kh_workflow -->

# Kh Workflow - KeeperHub Docs

## kh workflow[](https://docs.keeperhub.com/cli/commands/kh_workflow#kh-workflow)

Manage workflows

### Examples[](https://docs.keeperhub.com/cli/commands/kh_workflow#examples)

```
  # List workflows
  kh wf ls

  # Run a workflow
  kh wf run abc123
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_workflow#options)

```
  -h, --help        help for workflow
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_workflow#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_workflow#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh workflow create](https://docs.keeperhub.com/cli/commands/kh_workflow_create) - Create a workflow
-   [kh workflow delete](https://docs.keeperhub.com/cli/commands/kh_workflow_delete) - Delete a workflow
-   [kh workflow disable](https://docs.keeperhub.com/cli/commands/kh_workflow_disable) - Disable a workflow so it stops running
-   [kh workflow enable](https://docs.keeperhub.com/cli/commands/kh_workflow_enable) - Enable a workflow so it runs on its trigger
-   [kh workflow get](https://docs.keeperhub.com/cli/commands/kh_workflow_get) - Get a workflow
-   [kh workflow go-live](https://docs.keeperhub.com/cli/commands/kh_workflow_go-live) - Publish a workflow
-   [kh workflow list](https://docs.keeperhub.com/cli/commands/kh_workflow_list) - List workflows
-   [kh workflow run](https://docs.keeperhub.com/cli/commands/kh_workflow_run) - Run a workflow
-   [kh workflow update](https://docs.keeperhub.com/cli/commands/kh_workflow_update) - Update a workflow
