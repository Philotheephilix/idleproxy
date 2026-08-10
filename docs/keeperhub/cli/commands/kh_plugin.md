<!-- source: https://docs.keeperhub.com/cli/commands/kh_plugin -->

# Kh Plugin - KeeperHub Docs

## kh plugin[](https://docs.keeperhub.com/cli/commands/kh_plugin#kh-plugin)

Browse available plugins and integrations

### Examples[](https://docs.keeperhub.com/cli/commands/kh_plugin#examples)

```
  # List all plugins
  kh plugin ls

  # Get details for a plugin
  kh plugin g aave
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_plugin#options)

```
  -h, --help   help for plugin
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_plugin#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_plugin#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh plugin get](https://docs.keeperhub.com/cli/commands/kh_plugin_get) - Get plugin details and available actions
-   [kh plugin list](https://docs.keeperhub.com/cli/commands/kh_plugin_list) - List available plugins and integrations
