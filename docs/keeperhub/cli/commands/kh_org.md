<!-- source: https://docs.keeperhub.com/cli/commands/kh_org -->

# Kh Org - KeeperHub Docs

## kh org[](https://docs.keeperhub.com/cli/commands/kh_org#kh-org)

Manage organizations

### Examples[](https://docs.keeperhub.com/cli/commands/kh_org#examples)

```
  # List organizations you belong to
  kh o ls

  # Switch to a different organization
  kh o sw my-org-slug
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_org#options)

```
  -h, --help        help for org
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_org#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_org#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh org list](https://docs.keeperhub.com/cli/commands/kh_org_list) - List organizations
-   [kh org members](https://docs.keeperhub.com/cli/commands/kh_org_members) - List organization members
-   [kh org switch](https://docs.keeperhub.com/cli/commands/kh_org_switch) - Switch to an organization
