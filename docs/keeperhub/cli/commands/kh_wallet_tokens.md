<!-- source: https://docs.keeperhub.com/cli/commands/kh_wallet_tokens -->

# Kh Wallet Tokens - KeeperHub Docs

## kh wallet tokens[](https://docs.keeperhub.com/cli/commands/kh_wallet_tokens#kh-wallet-tokens)

List wallet tokens

```
kh wallet tokens [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_wallet_tokens#examples)

```
  # List supported tokens
  kh w tokens

  # Filter to a specific chain
  kh w tokens --chain 1
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_wallet_tokens#options)

```
      --chain string   Filter by chain
  -h, --help           help for tokens
      --limit int      Maximum number of tokens to list (default 50)
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_wallet_tokens#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_wallet_tokens#see-also)

-   [kh wallet](https://docs.keeperhub.com/cli/commands/kh_wallet) - Manage wallets (creator-wallet REST API or agentic-wallet npm package)
