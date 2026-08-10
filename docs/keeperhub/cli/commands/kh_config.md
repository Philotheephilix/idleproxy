<!-- source: https://docs.keeperhub.com/cli/commands/kh_config -->

# Kh Config - KeeperHub Docs

## kh config[](https://docs.keeperhub.com/cli/commands/kh_config#kh-config)

Manage CLI configuration

### Examples[](https://docs.keeperhub.com/cli/commands/kh_config#examples)

```
  # List all config values
  kh config ls

  # Set the default host
  kh config set default_host app.keeperhub.com
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_config#options)

```
  -h, --help   help for config
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_config#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_config#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh config get](https://docs.keeperhub.com/cli/commands/kh_config_get) - Get a configuration value
-   [kh config list](https://docs.keeperhub.com/cli/commands/kh_config_list) - List all configuration values
-   [kh config set](https://docs.keeperhub.com/cli/commands/kh_config_set) - Set a configuration value
