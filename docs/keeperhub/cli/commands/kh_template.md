<!-- source: https://docs.keeperhub.com/cli/commands/kh_template -->

# Kh Template - KeeperHub Docs

## kh template[](https://docs.keeperhub.com/cli/commands/kh_template#kh-template)

Manage workflow templates

### Examples[](https://docs.keeperhub.com/cli/commands/kh_template#examples)

```
  # List available templates
  kh tp ls

  # Deploy a template to your account
  kh tp deploy abc123
```

### Options[](https://docs.keeperhub.com/cli/commands/kh_template#options)

```
  -h, --help        help for template
      --jq string   Filter JSON output with a jq expression
      --json        Output as JSON
```

### Options inherited from parent commands[](https://docs.keeperhub.com/cli/commands/kh_template#options-inherited-from-parent-commands)

```
  -H, --host string   KeeperHub host (default: app.keeperhub.com)
      --no-color      Disable color output
      --org string    Organization ID to use (overrides default from auth)
  -y, --yes           Skip confirmation prompts
```

### SEE ALSO[](https://docs.keeperhub.com/cli/commands/kh_template#see-also)

-   [kh](https://docs.keeperhub.com/cli/commands/kh) - KeeperHub CLI
-   [kh template deploy](https://docs.keeperhub.com/cli/commands/kh_template_deploy) - Deploy a workflow template
-   [kh template list](https://docs.keeperhub.com/cli/commands/kh_template_list) - List workflow templates
