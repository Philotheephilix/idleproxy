<!-- source: https://docs.keeperhub.com/cli/commands/kh_run_logs -->

# Kh Run Logs - KeeperHub Docs

## kh run logs[](https://docs.keeperhub.com/cli/commands/kh_run_logs#kh-run-logs)

Show logs for a run

```
kh run logs <run-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_run_logs#examples)

```
  # Show step logs for a run
  kh r l abc123

  # Show logs as JSON
  kh r l abc123 --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_run_logs#options)

```
  -h, --help   help for logs
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_run_logs#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_run_logs#see-also)

-   [kh run](https://docs.keeperhub.com/cli/commands/kh_run) - Monitor workflow runs
