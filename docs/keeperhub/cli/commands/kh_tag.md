<!-- source: https://docs.keeperhub.com/cli/commands/kh_tag -->

# Kh Tag - KeeperHub Docs

## kh tag[](https://docs.keeperhub.com/cli/commands/kh_tag#kh-tag)

Manage tags

### Examples[](https://docs.keeperhub.com/cli/commands/kh_tag#examples)

```
  # List all tags
  kh t ls

  # Create a new tag
  kh t create "my-tag"
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_tag#options)

```
  -h, --help        help for tag
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
  -y, --yes         Skip confirmation prompts
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_tag#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_tag#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh tag create](https://docs.keeperhub.com/cli/commands/kh_tag_create) - Create a tag
-   [kh tag delete](https://docs.keeperhub.com/cli/commands/kh_tag_delete) - Delete a tag
-   [kh tag get](https://docs.keeperhub.com/cli/commands/kh_tag_get) - Get a tag
-   [kh tag list](https://docs.keeperhub.com/cli/commands/kh_tag_list) - List tags
