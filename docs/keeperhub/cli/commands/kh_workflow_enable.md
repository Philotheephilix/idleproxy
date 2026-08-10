<!-- source: https://docs.keeperhub.com/cli/commands/kh_workflow_enable -->

# Kh Workflow Enable - KeeperHub Docs

## kh workflow enable[](https://docs.keeperhub.com/cli/commands/kh_workflow_enable#kh-workflow-enable)

Enable a workflow so it runs on its trigger

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_workflow_enable#synopsis)

Enable a workflow so it runs on its trigger.

Turns on a workflow that is currently disabled. This is the last step after creating one - a workflow does nothing until it is enabled.

See also: kh workflow disable

```
kh workflow enable <workflow-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_workflow_enable#examples)

```
  # Enable a workflow (will prompt for confirmation)
  kh wf enable abc123

  # Enable without prompting
  kh wf enable abc123 --yes

  # resume is an alias and still works
  kh wf resume abc123
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_workflow_enable#options)

```
  -h, --help   help for enable
  -y, --yes    Skip confirmation prompt
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_workflow_enable#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_workflow_enable#see-also)

-   [kh workflow](https://docs.keeperhub.com/cli/commands/kh_workflow) - Manage workflows
