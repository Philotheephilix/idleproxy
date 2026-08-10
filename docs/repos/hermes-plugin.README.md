# keeperhub-hermes-plugin

A [Hermes](https://github.com/NousResearch/hermes-agent) agent plugin for
[KeeperHub](https://keeperhub.com) — gives your agent `kh_*` tools to manage and
run on-chain automation workflows, browse templates and protocol actions, and
(opt-in) execute transactions, all over the KeeperHub MCP API.

## Install

**Recommended — Hermes plugin manager (no pip needed):**

```bash
hermes plugins install KeeperHub/hermes-plugin --enable
```

**Or via pip / PyPI:**

```bash
pip install keeperhub-hermes-plugin
```
then enable it in your Hermes profile `~/.hermes/config.yaml`:
```yaml
plugins:
  enabled:
    - keeperhub
```

Either way, set your KeeperHub **organization** API key (prefix `kh_`, from
Settings → API Keys → Organisation) and restart Hermes:

```bash
export KH_API_KEY="kh_..."
```

The plugin's only dependency is `httpx`, which ships with Hermes — so the
clone-based install needs nothing extra.

## Safety: read-only by default

By default the plugin registers **read-only** tools (list/get/search workflows,
executions, templates, integrations, action schemas, status). Tools that change
organization state or move funds on-chain are **withheld** until you opt in:

```bash
export KEEPERHUB_ENABLE_WRITES=true
```

The gate is structural — withheld tools are never registered, so the agent can
neither call nor be delegated a tool that does not exist.

| Mode | Tools |
| --- | --- |
| Default (read-only) | `kh_list_workflows`, `kh_get_workflow`, `kh_search_org_workflows`, `kh_search_workflows_marketplace`, `kh_get_execution_status`, `kh_get_execution_logs`, `kh_get_direct_execution_status`, `kh_search_templates`, `kh_get_template`, `kh_search_plugins`, `kh_get_plugin`, `kh_list_action_schemas`, `kh_search_protocol_actions`, `kh_list_integrations`, `kh_get_wallet_integration`, `kh_ai_generate_workflow`, `kh_tools_documentation`, `kh_status` |
| `KEEPERHUB_ENABLE_WRITES=true` adds | `kh_create_workflow`, `kh_update_workflow`, `kh_delete_workflow`, `kh_execute_workflow`, `kh_deploy_template`, `kh_call_workflow`, `kh_execute_protocol_action`, `kh_execute_transfer`, `kh_execute_contract_call`, `kh_execute_check_and_execute` |

## Try it

Ask your agent things like:

- "List my KeeperHub workflows"
- "Show me workflow `<id>`"
- "What action schemas and chains does KeeperHub support?"
- "Check my KeeperHub connection status" → runs `kh_status`

## Configuration

| Env var | Required | Description |
| --- | --- | --- |
| `KH_API_KEY` | yes | KeeperHub organization API key (`kh_…`). |
| `KEEPERHUB_ENABLE_WRITES` | no | Set to `true`/`1`/`yes`/`on` to register write/exec tools. Default off. |

## Development

```bash
pip install -e ".[dev]"
pytest -q
```

## License

[Apache-2.0](./LICENSE)
