<!-- source: https://docs.keeperhub.com/cli/commands/kh_auth -->

# Kh Auth - KeeperHub Docs

## kh auth[](https://docs.keeperhub.com/cli/commands/kh_auth#kh-auth)

Authenticate with KeeperHub

### Examples[](https://docs.keeperhub.com/cli/commands/kh_auth#examples)

```
  # Log in via browser
  kh auth login

  # Check current auth status
  kh auth status
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_auth#options)

```
  -h, --help   help for auth
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_auth#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_auth#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh auth login](https://docs.keeperhub.com/cli/commands/kh_auth_login) - Log in to KeeperHub
-   [kh auth logout](https://docs.keeperhub.com/cli/commands/kh_auth_logout) - Log out of KeeperHub
-   [kh auth status](https://docs.keeperhub.com/cli/commands/kh_auth_status) - Show authentication status
