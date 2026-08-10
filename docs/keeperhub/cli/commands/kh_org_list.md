<!-- source: https://docs.keeperhub.com/cli/commands/kh_org_list -->

# Kh Org List - KeeperHub Docs

## kh org list[](https://docs.keeperhub.com/cli/commands/kh_org_list#kh-org-list)

List organizations

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_org_list#synopsis)

List organizations.

Requires a browser session. The underlying endpoint resolves a session cookie and does not inspect the Authorization header, so this command returns 401 under an API key regardless of the key’s scope - even while ‘kh workflow list’ and the rest of the CLI work normally with that same key. A 401 here is not a sign that your key is broken. See ‘kh auth-scope’.

```
kh org list [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_org_list#examples)

```
  # List all organizations
  kh o ls

  # List as JSON
  kh o ls --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_org_list#options)

```
  -h, --help   help for list
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_org_list#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_org_list#see-also)

-   [kh org](https://docs.keeperhub.com/cli/commands/kh_org) - Manage organizations
