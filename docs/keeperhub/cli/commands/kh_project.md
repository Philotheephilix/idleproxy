<!-- source: https://docs.keeperhub.com/cli/commands/kh_project -->

# Kh Project - KeeperHub Docs

## kh project[](https://docs.keeperhub.com/cli/commands/kh_project#kh-project)

Manage projects

### Examples[](https://docs.keeperhub.com/cli/commands/kh_project#examples)

```
  # List all projects
  kh p ls

  # Create a new project
  kh p create "My Project"
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_project#options)

```
  -h, --help        help for project
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
  -y, --yes         Skip confirmation prompts
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_project#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_project#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh project create](https://docs.keeperhub.com/cli/commands/kh_project_create) - Create a project
-   [kh project delete](https://docs.keeperhub.com/cli/commands/kh_project_delete) - Delete a project
-   [kh project get](https://docs.keeperhub.com/cli/commands/kh_project_get) - Get a project
-   [kh project list](https://docs.keeperhub.com/cli/commands/kh_project_list) - List projects
