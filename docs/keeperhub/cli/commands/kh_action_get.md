<!-- source: https://docs.keeperhub.com/cli/commands/kh_action_get -->

# Kh Action Get - KeeperHub Docs

## kh action get[](https://docs.keeperhub.com/cli/commands/kh_action_get#kh-action-get)

Get an action

```
kh action get <action-name> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_action_get#examples)

```
  # Get action by name
  kh a g ethereum-transfer

  # Get action details as JSON
  kh a g uniswap-swap --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_action_get#options)

```
  -h, --help   help for get
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_action_get#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_action_get#see-also)

-   [kh action](https://docs.keeperhub.com/cli/commands/kh_action) - Browse available actions
