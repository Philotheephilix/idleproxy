<!-- source: https://docs.keeperhub.com/cli/commands/kh_tag_get -->

# Kh Tag Get - KeeperHub Docs

## kh tag get[](https://docs.keeperhub.com/cli/commands/kh_tag_get#kh-tag-get)

Get a tag

```
kh tag get <tag-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_tag_get#examples)

```
  # Get tag details
  kh t g abc123

  # Get as JSON
  kh t g abc123 --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_tag_get#options)

```
  -h, --help   help for get
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_tag_get#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_tag_get#see-also)

-   [kh tag](https://docs.keeperhub.com/cli/commands/kh_tag) - Manage tags
