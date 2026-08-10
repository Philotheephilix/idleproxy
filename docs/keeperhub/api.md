<!-- source: https://docs.keeperhub.com/api -->

# API Overview

# API Overview

The KeeperHub API allows you to programmatically manage workflows, integrations, and executions.

## Base URL[](https://docs.keeperhub.com/api#base-url)

```
https://app.keeperhub.com
```

Endpoint paths throughout this reference are written with the `/api` prefix already included (for example `POST /api/workflows/create`). Append them to the base above exactly as shown. Setting a client’s base URL to `https://app.keeperhub.com/api` and then appending a documented path produces a doubled `/api/api` prefix and a 404.

That particular 404 names itself, so you do not have to guess. It answers with `error: "doubled_api_prefix"` and a `hint` carrying the corrected path:

```
{
  "error": "doubled_api_prefix",
  "detail": "Route GET /api/api/chains not found. The path is doubled: it contains /api twice.",
  "hint": "Your base URL already includes /api. Drop it from the base URL, or call /api/chains instead."
}
```

## Authentication[](https://docs.keeperhub.com/api#authentication)

API requests require authentication. Two methods are supported, but their accepted scope differs:

-   **Session**: Browser-based authentication via Better Auth. Accepted on every endpoint.
-   **API Key** (`kh_`): For programmatic access to organization-scoped endpoints (workflows, integrations, billing, organization management). Not accepted on user-account, wallet write, OAuth-account-bound, or per-user endpoints.

See [Authentication](https://docs.keeperhub.com/api/authentication) for the full scope.

## Response Format[](https://docs.keeperhub.com/api#response-format)

All responses are JSON. Successful responses come in three shapes, by resource kind. There is no `data` wrapper on any endpoint.

### Single resource[](https://docs.keeperhub.com/api#single-resource)

A read or write of one resource returns that resource as a bare object.

```
{
  "id": "wf_123",
  "name": "Treasury monitor"
}
```

`GET /api/user`, `GET /api/workflows/{workflowId}` and the direct-execution endpoints all answer this way.

### Paginated collection[](https://docs.keeperhub.com/api#paginated-collection)

A collection that paginates returns items alongside page metadata and links.

```
{
  "items": [ ... ],
  "meta": { "total": 42, "page": 1, "pageSize": 20, "totalPages": 3 },
  "_links": {
    "self": "...", "first": "...", "prev": null, "next": "...", "last": "..."
  }
}
```

`GET /api/keys`, `GET /api/workflows/{workflowId}/history` and `GET /api/security/audit` answer this way. Read `items`, and follow `_links.next` until it is `null`.

### Bare array[](https://docs.keeperhub.com/api#bare-array)

List endpoints that do not paginate return a plain JSON array with no envelope. `GET /api/chains` and `GET /api/workflows` both answer this way.

```
[
  { "chainId": 1, "name": "Ethereum Mainnet" }
]
```

When writing a generic client, key the unwrapping on the endpoint rather than sniffing the body.

### Error Response[](https://docs.keeperhub.com/api#error-response)

Errors return JSON of the form:

```
{
  "error": "wallet_not_configured",
  "detail": "No wallet provisioned for chain 8453 in org acme",
  "hint": "POST /api/integrations/wallet to provision a wallet for this org",
  "docs": "https://docs.keeperhub.com/api/integrations",
  "request_id": "5f5a7d4e-4f4f-4d6b-9c9a-3f7b1c0d2e1f"
}
```

Fields:

| Field | Type | Description |
| --- | --- | --- |
| `error` | string | Machine-readable, stable `snake_case` code. Branch on this — never on `detail` prose. |
| `detail` | string | Human-readable description of what went wrong. Safe to log or surface in developer tools, but not user-facing copy. |
| `hint` | string | Optional. Suggested recovery action (e.g. which endpoint to call, which field to fix). |
| `docs` | string | Optional. URL to the doc page that explains this error in depth. |
| `request_id` | string | Correlation id for the request. Echoed back on the `x-request-id` response header. Quote this in support tickets. |

Clients should:

-   Branch on `error` only. Copy in `detail` and `hint` may change without notice.
-   Tolerate the absence of `hint` and `docs`.
-   Capture `request_id` (or read the `x-request-id` response header) and include it when reporting issues.

A short list of canonical `error` codes is reused across endpoints: `unauthorized`, `insufficient_scope`, `not_found`, `invalid_input`, `conflict`, `rate_limited`, `internal_error`. Endpoint-specific codes (e.g. `wallet_not_configured`, `web3_integration_exists`) are documented on the page for the resource that raises them.

### Direct Execution errors[](https://docs.keeperhub.com/api#direct-execution-errors)

The `/api/execute/*` endpoints answer with a human-readable sentence in `error`, `field` naming the offending input where one applies, and `details` carrying context. Where a machine-readable code exists it is in `code`, for example `insufficient_balance` on a simulation that ran out of native currency. Branch on the HTTP status and on `code`, and treat `error` there as prose to log or show. See [Direct Execution](https://docs.keeperhub.com/api/direct-execution) for the per-endpoint shapes.

The `x-request-id` request header is honored when present: send any value (≤ 128 chars, no control characters) and it is reflected back on both the `request_id` response field and the `x-request-id` response header.

## Rate Limits[](https://docs.keeperhub.com/api#rate-limits)

API requests are subject to rate limiting. Current limits:

-   100 requests per minute for authenticated users
-   10 requests per minute for unauthenticated requests

## Available Endpoints[](https://docs.keeperhub.com/api#available-endpoints)

| Resource | Description |
| --- | --- |
| [Workflows](https://docs.keeperhub.com/api/workflows) | Create, read, update, delete workflows |
| [Executions](https://docs.keeperhub.com/api/executions) | Monitor workflow execution status and logs |
| [Direct Execution](https://docs.keeperhub.com/api/direct-execution) | Execute blockchain transactions without workflows |
| [Analytics](https://docs.keeperhub.com/api/analytics) | Workflow performance metrics and gas usage tracking |
| [Integrations](https://docs.keeperhub.com/api/integrations) | Manage notification and service integrations |
| [Projects](https://docs.keeperhub.com/api/projects) | Organize workflows into projects |
| [Tags](https://docs.keeperhub.com/api/tags) | Label and categorize workflows |
| [Chains](https://docs.keeperhub.com/api/chains) | List supported blockchain networks |
| [User](https://docs.keeperhub.com/api/user) | User profile, preferences, and address book |
| [Organizations](https://docs.keeperhub.com/api/organizations) | Organization membership management |
| [API Keys](https://docs.keeperhub.com/api/api-keys) | Manage API keys for programmatic access |

## SDKs[](https://docs.keeperhub.com/api#sdks)

Official SDKs are planned for future release. In the meantime, you can interact with the API directly using any HTTP client or library such as `fetch`, `axios`, or `requests`.
