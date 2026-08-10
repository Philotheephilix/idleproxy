<!-- source: https://docs.keeperhub.com/cli/commands/kh_run_status -->

# Kh Run Status - KeeperHub Docs

## kh run status[](https://docs.keeperhub.com/cli/commands/kh_run_status#kh-run-status)

Show the status of a run

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_run_status#synopsis)

Show the current status of a workflow run. Use —watch to poll until the run reaches a terminal state (success, error, or cancelled). Watch mode has no timeout and runs until Ctrl+C.

See also: kh r l, kh r cancel, kh wf run

```
kh run status <run-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_run_status#examples)

```
  # Show run status
  kh r st abc123

  # Watch until run completes
  kh r st abc123 --watch
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_run_status#options)

```
  -h, --help    help for status
      --watch   Live-update until complete
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_run_status#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_run_status#see-also)

-   [kh run](https://docs.keeperhub.com/cli/commands/kh_run) - Monitor workflow runs
