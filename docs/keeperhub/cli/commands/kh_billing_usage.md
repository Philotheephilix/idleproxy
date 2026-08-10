<!-- source: https://docs.keeperhub.com/cli/commands/kh_billing_usage -->

# Kh Billing Usage - KeeperHub Docs

## kh billing usage[](https://docs.keeperhub.com/cli/commands/kh_billing_usage#kh-billing-usage)

Show billing usage

```
kh billing usage [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_billing_usage#examples)

```
  # Show current period usage
  kh b u

  # Show usage for a specific period
  kh b u --period 2026-03
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_billing_usage#options)

```
  -h, --help            help for usage
      --period string   Billing period (e.g. 2026-03) (default "current")
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_billing_usage#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_billing_usage#see-also)

-   [kh billing](https://docs.keeperhub.com/cli/commands/kh_billing) - View billing and usage
