<!-- source: https://docs.keeperhub.com/cli/commands/kh_project_delete -->

# Kh Project Delete - KeeperHub Docs

## kh project delete[](https://docs.keeperhub.com/cli/commands/kh_project_delete#kh-project-delete)

Delete a project

```
kh project delete <project-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_project_delete#examples)

```
  # Delete a project (will prompt for confirmation)
  kh p delete abc123

  # Delete without prompting
  kh p delete abc123 --yes
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_project_delete#options)

```
  -h, --help   help for delete
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_project_delete#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_project_delete#see-also)

-   [kh project](https://docs.keeperhub.com/cli/commands/kh_project) - Manage projects
