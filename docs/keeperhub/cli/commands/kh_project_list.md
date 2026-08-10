<!-- source: https://docs.keeperhub.com/cli/commands/kh_project_list -->

# Kh Project List - KeeperHub Docs

## kh project list[](https://docs.keeperhub.com/cli/commands/kh_project_list#kh-project-list)

List projects

```
kh project list [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_project_list#examples)

```
  # List all projects
  kh p ls

  # List with a higher limit
  kh p ls --limit 50
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_project_list#options)

```
  -h, --help        help for list
      --limit int   Maximum number of projects to list (default 30)
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_project_list#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_project_list#see-also)

-   [kh project](https://docs.keeperhub.com/cli/commands/kh_project) - Manage projects
