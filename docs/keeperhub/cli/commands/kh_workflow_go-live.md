<!-- source: https://docs.keeperhub.com/cli/commands/kh_workflow_go-live -->

# Kh Workflow Go Live - KeeperHub Docs

## kh workflow go-live[](https://docs.keeperhub.com/cli/commands/kh_workflow_go-live#kh-workflow-go-live)

Publish a workflow

```
kh workflow go-live <workflow-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_workflow_go-live#examples)

```
  # Publish a workflow as a template
  kh wf go-live abc123 --name "My DeFi Template"

  # Publish with public tags
  kh wf go-live abc123 --name "Uniswap Swap" --tags tag1,tag2
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_workflow_go-live#options)

```
  -h, --help           help for go-live
      --name string    Name for the published workflow (required)
      --tags strings   Public tag IDs to attach
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_workflow_go-live#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_workflow_go-live#see-also)

-   [kh workflow](https://docs.keeperhub.com/cli/commands/kh_workflow) - Manage workflows
