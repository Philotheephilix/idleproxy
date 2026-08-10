<!-- source: https://docs.keeperhub.com/cli/commands/kh_template_deploy -->

# Kh Template Deploy - KeeperHub Docs

## kh template deploy[](https://docs.keeperhub.com/cli/commands/kh_template_deploy#kh-template-deploy)

Deploy a workflow template

```
kh template deploy <template-id> [flags]
```

### Examples[](https://docs.keeperhub.com/cli/commands/kh_template_deploy#examples)

```
  # Deploy a template using its ID
  kh tp deploy abc123

  # Deploy and give it a custom name
  kh tp deploy abc123 --name "My Uniswap Workflow"
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_template_deploy#options)

```
  -h, --help          help for deploy
      --name string   Workflow name
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_template_deploy#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --jq string     Filter JSON output with a jq expression
      --json          Output as JSON
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_template_deploy#see-also)

-   [kh template](https://docs.keeperhub.com/cli/commands/kh_template) - Manage workflow templates
