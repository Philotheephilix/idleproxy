<!-- source: https://docs.keeperhub.com/cli/commands/kh_doctor -->

# Kh Doctor - KeeperHub Docs

## kh doctor[](https://docs.keeperhub.com/cli/commands/kh_doctor#kh-doctor)

Check CLI health

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_doctor#synopsis)

Run diagnostic checks against your KeeperHub configuration and API connectivity. Checks auth validity, API reachability, organization wallet status, agentic wallet status and credit, spend cap, chain availability, and CLI version.

The agentic wallet check signs its request with the HMAC secret in ~/.keeperhub/wallet.json, so it reports only the wallet held on this machine. The secret is never printed.

See also: kh auth status, kh version

```
kh doctor [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_doctor#examples)

```
  # Run all health checks
  kh doctor

  # Output results as JSON
  kh doctor --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_doctor#options)

```
  -h, --help   help for doctor
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_doctor#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_doctor#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
