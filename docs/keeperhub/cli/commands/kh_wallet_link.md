<!-- source: https://docs.keeperhub.com/cli/commands/kh_wallet_link -->

# Kh Wallet Link - KeeperHub Docs

## kh wallet link[](https://docs.keeperhub.com/cli/commands/kh_wallet_link#kh-wallet-link)

Link the agentic wallet to a KeeperHub account (requires KH\_SESSION\_COOKIE)

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_wallet_link#synopsis)

Link the current agentic wallet to your KeeperHub account by calling POST /api/agentic-wallet/link.

Thin wrapper around `npx @keeperhub/wallet link`. Requires the KH\_SESSION\_COOKIE env var set to a valid kh session cookie (sign in at app.keeperhub.com, copy the session cookie, export it).

This command does not launch a browser session handshake; the env-var contract matches the npm CLI.

```
kh wallet link [flags]
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_wallet_link#options)

```
  -h, --help   help for link
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_wallet_link#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_wallet_link#see-also)

-   [kh wallet](https://docs.keeperhub.com/cli/commands/kh_wallet) - Manage wallets (creator-wallet REST API or agentic-wallet npm package)
