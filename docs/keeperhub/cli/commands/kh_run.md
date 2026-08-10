<!-- source: https://docs.keeperhub.com/cli/commands/kh_run -->

# Kh Run - KeeperHub Docs

## kh run[](https://docs.keeperhub.com/cli/commands/kh_run#kh-run)

Monitor workflow runs

### Examples[](https://docs.keeperhub.com/cli/commands/kh_run#examples)

```
  # Show status of a run
  kh r st abc123

  # Show step-by-step logs
  kh r l abc123
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_run#options)

```
  -h, --help   help for run
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_run#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_run#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh run cancel](https://docs.keeperhub.com/cli/commands/kh_run_cancel) - Cancel a run
-   [kh run logs](https://docs.keeperhub.com/cli/commands/kh_run_logs) - Show logs for a run
-   [kh run status](https://docs.keeperhub.com/cli/commands/kh_run_status) - Show the status of a run
