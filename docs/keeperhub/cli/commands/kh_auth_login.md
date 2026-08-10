<!-- source: https://docs.keeperhub.com/cli/commands/kh_auth_login -->

# Kh Auth Login - KeeperHub Docs

## kh auth login[](https://docs.keeperhub.com/cli/commands/kh_auth_login#kh-auth-login)

Log in to KeeperHub

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_auth_login#synopsis)

Authenticate with KeeperHub using the device code flow. Prints a URL and a one-time code; open the URL in a browser to confirm it. Use —with-token to read an API key from stdin for non-interactive automation.

See also: kh auth status, kh auth logout

```
kh auth login [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_auth_login#examples)

```
  # Log in (device code flow)
  kh auth login

  # Log in with an API key (non-interactive)
  echo "kh_xxx" | kh auth login --with-token
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_auth_login#options)

```
      --force        Log in again even if a valid credential is stored, creating a new API key
  -h, --help         help for login
      --with-token   Read token from stdin
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_auth_login#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_auth_login#see-also)

-   [kh auth](https://docs.keeperhub.com/cli/commands/kh_auth) - Authenticate with KeeperHub
