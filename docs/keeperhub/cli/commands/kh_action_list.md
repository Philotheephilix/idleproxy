<!-- source: https://docs.keeperhub.com/cli/commands/kh_action_list -->

# Kh Action List - KeeperHub Docs

## kh action list[](https://docs.keeperhub.com/cli/commands/kh_action_list#kh-action-list)

List available actions

```
kh action list [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_action_list#examples)

```
  # List all actions
  kh a ls

  # Filter by category
  kh a ls --category web3
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_action_list#options)

```
      --category string   Filter by category
  -h, --help              help for list
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_action_list#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_action_list#see-also)

-   [kh action](https://docs.keeperhub.com/cli/commands/kh_action) - Browse available actions
