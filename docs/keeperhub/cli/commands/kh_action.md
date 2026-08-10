<!-- source: https://docs.keeperhub.com/cli/commands/kh_action -->

# Kh Action - KeeperHub Docs

## kh action[](https://docs.keeperhub.com/cli/commands/kh_action#kh-action)

Browse available actions

### Examples[](https://docs.keeperhub.com/cli/commands/kh_action#examples)

```
  # List available actions
  kh a ls

  # Get details for a specific action
  kh a g ethereum-transfer
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_action#options)

```
  -h, --help        help for action
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_action#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_action#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh action get](https://docs.keeperhub.com/cli/commands/kh_action_get) - Get an action
-   [kh action list](https://docs.keeperhub.com/cli/commands/kh_action_list) - List available actions
