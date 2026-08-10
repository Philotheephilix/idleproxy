<!-- source: https://docs.keeperhub.com/cli/commands/kh_config_set -->

# Kh Config Set - KeeperHub Docs

## kh config set[](https://docs.keeperhub.com/cli/commands/kh_config_set#kh-config-set)

Set a configuration value

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_config_set#synopsis)

Persist a configuration key-value pair to the config file. Changes take effect immediately on the next command run. Use ‘kh config list’ to see all valid keys.

See also: kh config list, kh config get

```
kh config set <key> <value> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_config_set#examples)

```
  # Set the default host
  kh config set default_host app.keeperhub.com

  # Point CLI at a self-hosted instance
  kh config set default_host https://kh.mycompany.io
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_config_set#options)

```
  -h, --help   help for set
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_config_set#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_config_set#see-also)

-   [kh config](https://docs.keeperhub.com/cli/commands/kh_config) - Manage CLI configuration
