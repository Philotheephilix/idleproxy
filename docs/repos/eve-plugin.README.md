# keeperhub-eve-plugin

A [Vercel Eve](https://eve.dev) connection for [KeeperHub](https://keeperhub.com). It gives your agent KeeperHub tools to manage and run on-chain automation workflows, browse templates and protocol actions, and (opt-in) execute transactions, all over the KeeperHub MCP API.

Eve agents are directories of files, and a connection is one of them. This package wraps KeeperHub's hosted MCP server so you add it in two lines, with no endpoint or auth wiring to manage.

## Install

```bash
npm install keeperhub-eve-plugin
```

The package expects `eve` to already be present, which it is in any scaffolded Eve agent.

Create a connection file in your agent and export the helper:

```ts
// agent/connections/keeperhub.ts
import { keeperhub } from "keeperhub-eve-plugin";

export default keeperhub();
```

Set your KeeperHub organisation API key (prefix `kh_`, from Settings, API Keys, Organisation tab) and run your agent:

```bash
export KH_API_KEY="kh_..."
npx eve dev
```

The model never sees the URL or the key; Eve brokers the auth on every request.

## Safety: read-only by default

By default the connection registers read-only tools (list, get, and search workflows, executions, templates, integrations, and action schemas). Tools that change organization state or move funds on-chain are withheld until you opt in:

```bash
export KEEPERHUB_ENABLE_WRITES=true
```

The gate is structural. Withheld tools are blocked at the connection, so the agent can neither call nor be delegated a tool that is not registered. You can also pass `enableWrites: true` to the helper directly.

| Mode | Tools |
| --- | --- |
| Default (read-only) | `list_workflows`, `get_workflow`, `search_workflows`, `get_execution_status`, `get_execution_logs`, `get_direct_execution_status`, `search_templates`, `get_template`, `search_plugins`, `get_plugin`, `list_action_schemas`, `search_protocol_actions`, `list_integrations`, `get_wallet_integration`, `ai_generate_workflow`, `tools_documentation` |
| `KEEPERHUB_ENABLE_WRITES=true` adds | `create_workflow`, `update_workflow`, `delete_workflow`, `execute_workflow`, `deploy_template`, `call_workflow`, `execute_protocol_action`, `execute_transfer`, `execute_contract_call`, `execute_check_and_execute` |

When writes are enabled, the connection also defaults to `once()` human approval, so the first write or execute in a session pauses for a person. Pass `approval` to change this; import policies from `eve/tools/approval`.

## Try it

Ask your agent things like:

- "List my KeeperHub workflows"
- "Show me workflow `<id>`"
- "What action schemas and chains does KeeperHub support?"
- "Search the templates for Aave"

With writes enabled, you can go further: "Create a workflow that watches my wallet's ETH balance and alerts me on Telegram when it drops below 0.5."

## Configuration

```ts
import { keeperhub } from "keeperhub-eve-plugin";

export default keeperhub({
  apiKeyEnv: "KH_API_KEY",            // env var holding the kh_ key
  enableWrites: false,                // register write and execute tools
  url: "https://app.keeperhub.com/mcp", // override for a per-workflow endpoint
});
```

| Env var | Required | Description |
| --- | --- | --- |
| `KH_API_KEY` | yes | KeeperHub organisation API key (`kh_...`). The env var name is configurable via `apiKeyEnv`. |
| `KEEPERHUB_ENABLE_WRITES` | no | Set to `true`, `1`, `yes`, or `on` to register write and execute tools. Default off. |

For the full tool reference and per-workflow endpoints, see the [KeeperHub MCP docs](https://docs.keeperhub.com/ai-tools/mcp-server).

## Known limitation

The hosted aggregate endpoint currently exposes a very large tool set, so listing every workflow at once can exceed a model's context window. Work in pages: pass a small `limit` to `list_workflows` and narrow with `project_id`. Creating, reading, and operating on specific workflows is unaffected. This is tracked for a server-side fix; until then, avoid unbounded listing.

## Development

```bash
npm install
npm run build
npm test
```

## License

[Apache-2.0](./LICENSE)
