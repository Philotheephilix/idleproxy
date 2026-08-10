<!-- source: https://docs.keeperhub.com/cli/commands/kh_tag_create -->

# Kh Tag Create - KeeperHub Docs

## kh tag create[](https://docs.keeperhub.com/cli/commands/kh_tag_create#kh-tag-create)

Create a tag

```
kh tag create <name> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_tag_create#examples)

```
  # Create a tag with default color
  kh t create "defi"

  # Create a tag with a custom color
  kh t create "urgent" --color "#ef4444"
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_tag_create#options)

```
      --color string   Tag color (default: #6366f1) (default "#6366f1")
  -h, --help           help for create
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_tag_create#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_tag_create#see-also)

-   [kh tag](https://docs.keeperhub.com/cli/commands/kh_tag) - Manage tags
