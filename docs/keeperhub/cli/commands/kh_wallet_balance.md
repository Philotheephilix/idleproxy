<!-- source: https://docs.keeperhub.com/cli/commands/kh_wallet_balance -->

# Kh Wallet Balance - KeeperHub Docs

## kh wallet balance[](https://docs.keeperhub.com/cli/commands/kh_wallet_balance#kh-wallet-balance)

Show wallet balance

```
kh wallet balance [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_wallet_balance#examples)

```
  # Show balances for all chains
  kh w balance

  # Filter to a specific chain
  kh w balance --chain Ethereum
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_wallet_balance#options)

```
      --chain string   Filter by chain
  -h, --help           help for balance
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_wallet_balance#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_wallet_balance#see-also)

-   [kh wallet](https://docs.keeperhub.com/cli/commands/kh_wallet) - Manage wallets (creator-wallet REST API or agentic-wallet npm package)
