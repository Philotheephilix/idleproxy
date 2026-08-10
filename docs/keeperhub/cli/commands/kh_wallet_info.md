<!-- source: https://docs.keeperhub.com/cli/commands/kh_wallet_info -->

# Kh Wallet Info - KeeperHub Docs

## kh wallet info[](https://docs.keeperhub.com/cli/commands/kh_wallet_info#kh-wallet-info)

Print subOrgId and walletAddress from local agentic wallet config

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_wallet_info#synopsis)

Print subOrgId and walletAddress from ~/.keeperhub/wallet.json.

Thin wrapper around `npx @keeperhub/wallet info`. Exits non-zero if the config is missing.

```
kh wallet info [flags]
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_wallet_info#options)

```
  -h, --help   help for info
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_wallet_info#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_wallet_info#see-also)

-   [kh wallet](https://docs.keeperhub.com/cli/commands/kh_wallet) - Manage wallets (creator-wallet REST API or agentic-wallet npm package)
