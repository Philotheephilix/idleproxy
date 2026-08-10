<!-- source: https://docs.keeperhub.com/cli/commands/kh_wallet -->

# Kh Wallet - KeeperHub Docs

## kh wallet[](https://docs.keeperhub.com/cli/commands/kh_wallet#kh-wallet)

Manage wallets (creator-wallet REST API or agentic-wallet npm package)

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_wallet#synopsis)

Manage wallets.

Creator wallet (REST): kh w balance show creator-wallet on-chain balances via KeeperHub REST API kh w tokens list supported tokens

Agentic wallet (thin wrappers around npx @keeperhub/wallet): kh w add provision a new agentic wallet (no account required) kh w info print agentic subOrgId + walletAddress kh w fund print Coinbase Onramp URL + Tempo deposit address kh w link link agentic wallet to a KeeperHub account (needs KH\_SESSION\_COOKIE) kh w feedback submit ERC-8004 feedback for a workflow execution this wallet paid for

### Examples[](https://docs.keeperhub.com/cli/commands/kh_wallet#examples)

```
  # Creator wallet balance (REST):
  kh w balance

  # Provision an agentic wallet (npx wrapper):
  kh w add

  # Check balance on the agentic wallet:
  npx @keeperhub/wallet balance
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_wallet#options)

```
  -h, --help        help for wallet
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_wallet#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_wallet#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh wallet add](https://docs.keeperhub.com/cli/commands/kh_wallet_add) - Provision a new agentic wallet (no KeeperHub account required)
-   [kh wallet balance](https://docs.keeperhub.com/cli/commands/kh_wallet_balance) - Show wallet balance
-   [kh wallet feedback](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback) - Submit ERC-8004 feedback for a workflow execution this wallet paid for
-   [kh wallet fund](https://docs.keeperhub.com/cli/commands/kh_wallet_fund) - Print Coinbase Onramp URL (Base USDC) and Tempo deposit address for the agentic wallet
-   [kh wallet info](https://docs.keeperhub.com/cli/commands/kh_wallet_info) - Print subOrgId and walletAddress from local agentic wallet config
-   [kh wallet link](https://docs.keeperhub.com/cli/commands/kh_wallet_link) - Link the agentic wallet to a KeeperHub account (requires KH\_SESSION\_COOKIE)
-   [kh wallet tokens](https://docs.keeperhub.com/cli/commands/kh_wallet_tokens) - List wallet tokens
