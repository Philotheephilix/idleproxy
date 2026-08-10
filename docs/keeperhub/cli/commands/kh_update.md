<!-- source: https://docs.keeperhub.com/cli/commands/kh_update -->

# Kh Update - KeeperHub Docs

## kh update[](https://docs.keeperhub.com/cli/commands/kh_update#kh-update)

Update kh to the latest version

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_update#synopsis)

Update kh to the latest version by downloading the newest release from GitHub.

If kh was installed via Homebrew, this command will print the appropriate brew command to use instead of replacing the binary directly. Homebrew manages its own binary lifecycle and must be used to keep the installation consistent.

```
kh update [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_update#examples)

```
  # Check for and install the latest version
  kh update
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_update#options)

```
  -h, --help   help for update
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_update#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_update#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
