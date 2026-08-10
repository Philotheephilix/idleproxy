<!-- source: https://docs.keeperhub.com/cli/commands/kh_execute_transfer -->

# Kh Execute Transfer - KeeperHub Docs

## kh execute transfer[](https://docs.keeperhub.com/cli/commands/kh_execute_transfer#kh-execute-transfer)

Transfer tokens

```
kh execute transfer [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_execute_transfer#examples)

```
  # Transfer ETH and wait for completion
  kh ex t --chain 1 --to 0xABCD... --amount 0.01 --wait

  # Transfer an ERC-20 token
  kh ex t --chain 1 --to 0xABCD... --amount 100 --token-address 0xUSDC...
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_execute_transfer#options)

```
      --amount string          Amount to transfer (required)
      --chain string           Chain ID (required)
  -h, --help                   help for transfer
      --timeout duration       Timeout when using --wait (default 5m0s)
      --to string              Recipient address (required)
      --token string           Token symbol (default "ETH")
      --token-address string   ERC-20 token contract address
      --wait                   Wait for completion
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_execute_transfer#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_execute_transfer#see-also)

-   [kh execute](https://docs.keeperhub.com/cli/commands/kh_execute) - Execute direct blockchain actions
