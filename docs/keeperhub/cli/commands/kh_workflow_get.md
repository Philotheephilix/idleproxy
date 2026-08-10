<!-- source: https://docs.keeperhub.com/cli/commands/kh_workflow_get -->

# Kh Workflow Get - KeeperHub Docs

## kh workflow get[](https://docs.keeperhub.com/cli/commands/kh_workflow_get#kh-workflow-get)

Get a workflow

```
kh workflow get <workflow-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_workflow_get#examples)

```
  # Get workflow details
  kh wf g abc123

  # Get as JSON
  kh wf g abc123 --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_workflow_get#options)

```
  -h, --help   help for get
      --web    Open the workflow in the browser
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_workflow_get#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_workflow_get#see-also)

-   [kh workflow](https://docs.keeperhub.com/cli/commands/kh_workflow) - Manage workflows
