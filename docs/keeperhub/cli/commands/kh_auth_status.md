<!-- source: https://docs.keeperhub.com/cli/commands/kh_auth_status -->

# Kh Auth Status - KeeperHub Docs

## kh auth status[](https://docs.keeperhub.com/cli/commands/kh_auth_status#kh-auth-status)

Show authentication status

```
kh auth status [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_auth_status#examples)

```
  # Show current auth status
  kh auth status

  # Show status as JSON
  kh auth status --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_auth_status#options)

```
  -h, --help   help for status
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_auth_status#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_auth_status#see-also)

-   [kh auth](https://docs.keeperhub.com/cli/commands/kh_auth) - Authenticate with KeeperHub
