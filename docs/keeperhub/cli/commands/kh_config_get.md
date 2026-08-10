<!-- source: https://docs.keeperhub.com/cli/commands/kh_config_get -->

# Kh Config Get - KeeperHub Docs

## kh config get[](https://docs.keeperhub.com/cli/commands/kh_config_get#kh-config-get)

Get a configuration value

```
kh config get <key> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_config_get#examples)

```
  # Get the default host
  kh config get default_host
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_config_get#options)

```
  -h, --help   help for get
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_config_get#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_config_get#see-also)

-   [kh config](https://docs.keeperhub.com/cli/commands/kh_config) - Manage CLI configuration
