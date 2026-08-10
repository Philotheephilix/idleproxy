<!-- source: https://docs.keeperhub.com/cli/commands/kh_plugin_get -->

# Kh Plugin Get - KeeperHub Docs

## kh plugin get[](https://docs.keeperhub.com/cli/commands/kh_plugin_get#kh-plugin-get)

Get plugin details and available actions

```
kh plugin get <plugin-name> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_plugin_get#examples)

```
  # Get plugin reference card
  kh plugin g aave

  # Get plugin details as JSON
  kh plugin g morpho --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_plugin_get#options)

```
  -h, --help      help for get
      --refresh   Bypass local cache and fetch fresh data
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_plugin_get#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_plugin_get#see-also)

-   [kh plugin](https://docs.keeperhub.com/cli/commands/kh_plugin) - Browse available plugins and integrations
