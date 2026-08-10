<!-- source: https://docs.keeperhub.com/cli/commands/kh_project_get -->

# Kh Project Get - KeeperHub Docs

## kh project get[](https://docs.keeperhub.com/cli/commands/kh_project_get#kh-project-get)

Get a project

```
kh project get <project-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_project_get#examples)

```
  # Get project details
  kh p g abc123

  # Get as JSON
  kh p g abc123 --json
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_project_get#options)

```
  -h, --help   help for get
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_project_get#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_project_get#see-also)

-   [kh project](https://docs.keeperhub.com/cli/commands/kh_project) - Manage projects
