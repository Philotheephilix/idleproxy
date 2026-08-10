<!-- source: https://docs.keeperhub.com/cli/commands/kh_run_cancel -->

# Kh Run Cancel - KeeperHub Docs

## kh run cancel[](https://docs.keeperhub.com/cli/commands/kh_run_cancel#kh-run-cancel)

Cancel a run

```
kh run cancel <run-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_run_cancel#examples)

```
  # Cancel a run (will prompt for confirmation)
  kh r cancel abc123

  # Cancel without prompting
  kh r cancel abc123 --yes
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_run_cancel#options)

```
  -h, --help   help for cancel
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_run_cancel#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_run_cancel#see-also)

-   [kh run](https://docs.keeperhub.com/cli/commands/kh_run) - Monitor workflow runs
