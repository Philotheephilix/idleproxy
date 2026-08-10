<!-- source: https://docs.keeperhub.com/workflows/schema-reference -->

# Workflow Schema Reference

# Workflow Schema Reference

Details of the workflow JSON schema that the rest of the docs do not spell out: which `config` fields are JSON-encoded strings rather than raw arrays, how `functionArgs` maps onto ABI inputs, and the exact shapes the strict validator accepts.

* * *

## The critical fields[](https://docs.keeperhub.com/workflows/schema-reference#the-critical-fields)

### `abi` — must be a JSON string, not an array[](https://docs.keeperhub.com/workflows/schema-reference#abi--must-be-a-json-string-not-an-array)

**Wrong (causes 422 error):**

```
{
  "abi": [{ "name": "transfer", "type": "function", ... }]
}
```

**Correct:**

```
{
  "abi": "[{\"name\":\"transfer\",\"type\":\"function\",...}]"
}
```

Always `JSON.stringify()` your ABI before putting it in the config.

* * *

### `functionArgs` — a JSON-stringified positional array[](https://docs.keeperhub.com/workflows/schema-reference#functionargs--a-json-stringified-positional-array)

`functionArgs` is a JSON-stringified positional array whose elements map to the ABI inputs by index.

**Wrong:**

```
{
  "functionArgs": "[{\"to\":\"0xRecipient\",\"amount\":\"1000000\"}]"
}
```

**Correct:**

```
{
  "functionArgs": "[\"0xRecipient\",\"1000000\"]"
}
```

Note: named-field objects only apply to a single `tuple`/struct parameter, not as a wrapper for all args.

* * *

### `tokenConfig` for `web3/approve-token`[](https://docs.keeperhub.com/workflows/schema-reference#tokenconfig-for-web3approve-token)

`tokenConfig` accepts either a bare `0x`\-prefixed token address (treated as the token address directly) or a JSON string with the full custom token shape. Both work:

```
{ "tokenConfig": "0xTokenAddress" }
```

```
{
  "tokenConfig": "{\"mode\":\"custom\",\"customToken\":{\"address\":\"0xTokenAddress\"}}"
}
```

Note: `symbol` is fetched on-chain; you don’t need to provide it.

* * *

### Deadlines — keep template substitution result valid JSON[](https://docs.keeperhub.com/workflows/schema-reference#deadlines--keep-template-substitution-result-valid-json)

Template expressions inside `functionArgs` are supported and resolve before `JSON.parse`. The rule is: ensure the substituted result is valid JSON. Computing values like deadlines beforehand is the safest approach:

```
const deadline = Math.floor(Date.now() / 1000) + 600;
functionArgs: JSON.stringify([deadline])
```

Avoid arithmetic expressions after substitution (e.g. `{{timestamp}} + 3600`) as they produce invalid JSON.

* * *

### `network` — recommended as a string chain ID[](https://docs.keeperhub.com/workflows/schema-reference#network--recommended-as-a-string-chain-id)

A string chain ID is the recommended form:

```
{ "network": "11155111" }
{ "network": "1" }
```

The API also accepts raw numbers and legacy names like `"sepolia"` or `"base"` at runtime, but string chain IDs are the safest and most explicit.

* * *

### `gasLimitMultiplier` — pass as a string[](https://docs.keeperhub.com/workflows/schema-reference#gaslimitmultiplier--pass-as-a-string)

```
{ "gasLimitMultiplier": "1.5" }
```

Helps avoid out-of-gas errors on complex transactions.

* * *

## Endpoint reference[](https://docs.keeperhub.com/workflows/schema-reference#endpoint-reference)

### Create workflow[](https://docs.keeperhub.com/workflows/schema-reference#create-workflow)

```
POST /api/workflows/create
```

### Execute workflow[](https://docs.keeperhub.com/workflows/schema-reference#execute-workflow)

```
POST /api/workflow/{workflowId}/execute
```

or

```
POST /api/workflows/{workflowId}/execute
```

Both routes work identically.

### Get execution status[](https://docs.keeperhub.com/workflows/schema-reference#get-execution-status)

```
GET /api/workflows/executions/{executionId}/status
```

Returns a `transactionHashes` array in the success payload — you can read tx hashes directly from the status response without fetching logs separately.

### Get execution logs[](https://docs.keeperhub.com/workflows/schema-reference#get-execution-logs)

```
GET /api/workflows/executions/{executionId}/logs
```

* * *

## Node structure[](https://docs.keeperhub.com/workflows/schema-reference#node-structure)

Every node follows this shape (`status` and `description` are optional):

```
{
  id: "unique-id",
  type: "trigger" | "action",
  data: {
    label: "Human readable name",
    type: "trigger" | "action",
    config: { ... },
    // status and description are optional
  }
}
```

* * *

## Trigger node[](https://docs.keeperhub.com/workflows/schema-reference#trigger-node)

```
{
  id: "trigger",
  type: "trigger",
  data: {
    label: "Manual Trigger",
    type: "trigger",
    config: { triggerType: "Manual" },
  }
}
```

Use the capitalized canonical value: `"Manual"`, `"Schedule"`, `"Webhook"`, `"Event"`, `"Block"`, `"Transfer"`.

* * *

## Edge structure[](https://docs.keeperhub.com/workflows/schema-reference#edge-structure)

```
{
  id: "e1",
  source: "trigger",
  target: "step-1"
}
```

* * *

## Finding your wallet integration ID[](https://docs.keeperhub.com/workflows/schema-reference#finding-your-wallet-integration-id)

```
const res = await axios.get("https://app.keeperhub.com/api/integrations", {
  headers: { Authorization: `Bearer ${API_KEY}` }
});
const walletId = res.data[0].id; // bare array, no wrapper
```

* * *

## Transaction hash location[](https://docs.keeperhub.com/workflows/schema-reference#transaction-hash-location)

The workflow execution status endpoint returns `transactionHashes` directly in the success payload. You can read tx hashes from the status response without fetching logs:

```
const status = await getExecutionStatus(executionId);
const txHashes = status.transactionHashes;
```

* * *

## What we found genuinely undocumented[](https://docs.keeperhub.com/workflows/schema-reference#what-we-found-genuinely-undocumented)

1.  `abi` must be `JSON.stringify()`’d — causes a silent 422 if not
2.  `gasLimitMultiplier` must be a string, not a number
3.  The edge shape (`id`, `source`, `target`) is not in the quickstart
4.  The create/status/logs endpoint paths are not in one place in the docs
