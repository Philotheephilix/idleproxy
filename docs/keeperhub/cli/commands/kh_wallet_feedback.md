<!-- source: https://docs.keeperhub.com/cli/commands/kh_wallet_feedback -->

# Kh Wallet Feedback - KeeperHub Docs

## kh wallet feedback[](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback#kh-wallet-feedback)

Submit ERC-8004 feedback for a workflow execution this wallet paid for

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback#synopsis)

Submit ERC-8004 ReputationRegistry feedback for a workflow execution this wallet paid for. Signs giveFeedback() via Turnkey and broadcasts on Ethereum mainnet via the KeeperHub server proxy. Caller wallet pays gas natively (~$0.05-2 per call at typical mainnet gas).

Thin wrapper around `npx @keeperhub/wallet feedback`. Defaults to rating KeeperHub’s own ERC-8004 agent (id 31875 on Ethereum); use —agent-id to rate any other agent.

```
kh wallet feedback [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback#examples)

```
  # 5-star rating for an execution this wallet paid for
  kh w feedback --execution-id c5ybokpmwxi7kiau5wxja --value 5

  # 4.5-star rating with a comment
  kh w feedback --execution-id c5ybokpmwxi7kiau5wxja --value 45 --decimals 1 --comment "very helpful"
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback#options)

```
      --agent-id string       rated agent NFT id (uint256 decimal); defaults to KeeperHub agent 31875
      --chain-id string       agent chain id; defaults to 1 (Ethereum mainnet)
      --comment string        optional plaintext comment included in the feedbackURI JSON
      --decimals string       decimals for value (0..18); 0 for integer scores, 1 for 0.1-step (default 0)
      --execution-id string   workflow execution id (from a previous call_workflow response) (required)
  -h, --help                  help for feedback
      --value string          raw int128 rating value, e.g. 5 with --decimals 0 for a 5-star rating (required)
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_wallet_feedback#see-also)

-   [kh wallet](https://docs.keeperhub.com/cli/commands/kh_wallet) - Manage wallets (creator-wallet REST API or agentic-wallet npm package)
