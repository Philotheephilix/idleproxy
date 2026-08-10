<!-- source: https://docs.keeperhub.com/cli/commands/kh_billing -->

# Kh Billing - KeeperHub Docs

## kh billing[](https://docs.keeperhub.com/cli/commands/kh_billing#kh-billing)

View billing and usage

### Examples[](https://docs.keeperhub.com/cli/commands/kh_billing#examples)

```
  # Show billing status
  kh b st

  # Show usage for current period
  kh b u
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_billing#options)

```
  -h, --help        help for billing
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_billing#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_billing#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh billing status](https://docs.keeperhub.com/cli/commands/kh_billing_status) - Show billing status
-   [kh billing usage](https://docs.keeperhub.com/cli/commands/kh_billing_usage) - Show billing usage
