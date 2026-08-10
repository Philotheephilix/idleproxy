<!-- source: https://docs.keeperhub.com/cli/commands/kh_tag_delete -->

# Kh Tag Delete - KeeperHub Docs

## kh tag delete[](https://docs.keeperhub.com/cli/commands/kh_tag_delete#kh-tag-delete)

Delete a tag

```
kh tag delete <tag-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_tag_delete#examples)

```
  # Delete a tag (will prompt for confirmation)
  kh t delete abc123

  # Delete without prompting
  kh t delete abc123 --yes
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_tag_delete#options)

```
  -h, --help   help for delete
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_tag_delete#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_tag_delete#see-also)

-   [kh tag](https://docs.keeperhub.com/cli/commands/kh_tag) - Manage tags
