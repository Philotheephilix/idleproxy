<!-- source: https://docs.keeperhub.com/cli/commands/kh_org_switch -->

# Kh Org Switch - KeeperHub Docs

## kh org switch[](https://docs.keeperhub.com/cli/commands/kh_org_switch#kh-org-switch)

Switch to an organization

```
kh org switch <org-slug> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_org_switch#examples)

```
  # Switch to an organization by slug
  kh o sw my-org

  # Find org slugs first
  kh o ls
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_org_switch#options)

```
  -h, --help   help for switch
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_org_switch#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_org_switch#see-also)

-   [kh org](https://docs.keeperhub.com/cli/commands/kh_org) - Manage organizations
