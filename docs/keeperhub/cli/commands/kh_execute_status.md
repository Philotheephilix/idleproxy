<!-- source: https://docs.keeperhub.com/cli/commands/kh_execute_status -->

# Kh Execute Status - KeeperHub Docs

## kh execute status[](https://docs.keeperhub.com/cli/commands/kh_execute_status#kh-execute-status)

Show the status of an execution

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_execute_status#synopsis)

Show the status of a direct blockchain execution (transfer or contract call). Use —watch to poll until the execution reaches a terminal state.

See also: kh r st, kh ex transfer, kh ex cc

```
kh execute status <execution-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_execute_status#examples)

```
  # Show execution status
  kh ex st abc123

  # Watch until completion
  kh ex st abc123 --watch
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_execute_status#options)

```
  -h, --help    help for status
      --watch   Live-update until complete
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_execute_status#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_execute_status#see-also)

-   [kh execute](https://docs.keeperhub.com/cli/commands/kh_execute) - Execute direct blockchain actions
