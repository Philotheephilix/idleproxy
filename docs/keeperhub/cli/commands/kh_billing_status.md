<!-- source: https://docs.keeperhub.com/cli/commands/kh_billing_status -->

# Kh Billing Status - KeeperHub Docs

## kh billing status[](https://docs.keeperhub.com/cli/commands/kh_billing_status#kh-billing-status)

Show billing status

```
kh billing status [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_billing_status#examples)

```
  # Show billing plan and usage
  kh b st

  # Show as JSON
  kh b st --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_billing_status#options)

```
  -h, --help   help for status
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_billing_status#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_billing_status#see-also)

-   [kh billing](https://docs.keeperhub.com/cli/commands/kh_billing) - View billing and usage
