<!-- source: https://docs.keeperhub.com/cli/commands/kh_project_create -->

# Kh Project Create - KeeperHub Docs

## kh project create[](https://docs.keeperhub.com/cli/commands/kh_project_create#kh-project-create)

Create a project

```
kh project create <name> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_project_create#examples)

```
  # Create a project
  kh p create "My Project"

  # Create with a description
  kh p create "DeFi Automations" --description "Uniswap and Aave workflows"
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_project_create#options)

```
      --description string   Project description
  -h, --help                 help for create
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_project_create#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_project_create#see-also)

-   [kh project](https://docs.keeperhub.com/cli/commands/kh_project) - Manage projects
