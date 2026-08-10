<!-- source: https://docs.keeperhub.com/cli/commands/kh_template_list -->

# Kh Template List - KeeperHub Docs

## kh template list[](https://docs.keeperhub.com/cli/commands/kh_template_list#kh-template-list)

List workflow templates

```
kh template list [query] [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_template_list#examples)

```
  # List featured templates
  kh tp ls

  # Search templates by keyword
  kh tp ls defi
  kh tp ls --query monitor

  # List templates as JSON
  kh tp ls --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_template_list#options)

```
  -h, --help           help for list
  -q, --query string   Filter templates by name or description
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_template_list#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_template_list#see-also)

-   [kh template](https://docs.keeperhub.com/cli/commands/kh_template) - Manage workflow templates
