<!-- source: https://docs.keeperhub.com/cli/commands/kh_tag_list -->

# Kh Tag List - KeeperHub Docs

## kh tag list[](https://docs.keeperhub.com/cli/commands/kh_tag_list#kh-tag-list)

List tags

```
kh tag list [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_tag_list#examples)

```
  # List all tags
  kh t ls

  # List with a higher limit
  kh t ls --limit 50
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_tag_list#options)

```
  -h, --help        help for list
      --limit int   Maximum number of tags to list (default 30)
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_tag_list#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_tag_list#see-also)

-   [kh tag](https://docs.keeperhub.com/cli/commands/kh_tag) - Manage tags
