<!-- source: https://docs.keeperhub.com/cli/commands/kh_completion -->

# Kh Completion - KeeperHub Docs

## kh completion[](https://docs.keeperhub.com/cli/commands/kh_completion#kh-completion)

Generate shell completion scripts

### Synopsis[](https://docs.keeperhub.com/cli/commands/kh_completion#synopsis)

Generate shell completion scripts for kh. Source the output in your shell profile to enable tab completion for all kh commands and flags.

See also: kh help environment

```
kh completion <shell> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_completion#examples)

```
  # Generate zsh completions
  kh completion zsh > ~/.zsh/completions/_kh

  # Generate bash completions
  kh completion bash > /etc/bash_completion.d/kh
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_completion#options)

```
  -h, --help   help for completion
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_completion#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_completion#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
