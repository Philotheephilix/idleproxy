<!-- source: https://docs.keeperhub.com/cli/commands/kh_plugin_list -->

# Kh Plugin List - KeeperHub Docs

## kh plugin list[](https://docs.keeperhub.com/cli/commands/kh_plugin_list#kh-plugin-list)

List available plugins and integrations

```
kh plugin list [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_plugin_list#examples)

```
  # List all plugins (cached)
  kh plugin ls

  # Force refresh from API
  kh plugin ls --refresh
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_plugin_list#options)

```
  -h, --help      help for list
      --refresh   Bypass local cache and fetch fresh data
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_plugin_list#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_plugin_list#see-also)

-   [kh plugin](https://docs.keeperhub.com/cli/commands/kh_plugin) - Browse available plugins and integrations
