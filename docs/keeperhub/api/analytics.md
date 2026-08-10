<!-- source: https://docs.keeperhub.com/api/analytics -->

# Analytics API

# Analytics API

The Analytics API provides insights into workflow and direct execution performance, gas usage, and execution trends across your organization.

## Get Analytics Summary[](https://docs.keeperhub.com/api/analytics#get-analytics-summary)

```
GET /api/analytics/summary
```

Returns aggregated analytics for the organization including run counts, success rates, and gas usage.

### Query Parameters[](https://docs.keeperhub.com/api/analytics#query-parameters)

| Parameter | Type | Description |
| --- | --- | --- |
| `range` | string | Time range: `24h`, `7d`, `30d`, `90d`, `custom` (default: `30d`) |
| `customStart` | string | ISO timestamp for custom range start |
| `customEnd` | string | ISO timestamp for custom range end |

### Response[](https://docs.keeperhub.com/api/analytics#response)

```
{
  "totalRuns": 1250,
  "successfulRuns": 1180,
  "failedRuns": 70,
  "successRate": 94.4,
  "totalGasUsedWei": "15000000000000000",
  "avgExecutionTimeMs": 2340
}
```

**Field Definitions**

| Field | Type | Description |
| --- | --- | --- |
| `totalRuns` | number | Combined count of workflow executions and direct executions |
| `successfulRuns` | number | Number of executions that completed successfully |
| `failedRuns` | number | Number of executions that failed |
| `successRate` | number | Percentage of successful executions (0-100) |
| `totalGasUsedWei` | string | Total gas consumed in wei across both workflow executions and direct executions |
| `avgExecutionTimeMs` | number | Average execution duration in milliseconds |

## Get Time Series Data[](https://docs.keeperhub.com/api/analytics#get-time-series-data)

```
GET /api/analytics/time-series
```

Returns time-bucketed run counts for charting execution volume over time.

### Query Parameters[](https://docs.keeperhub.com/api/analytics#query-parameters-1)

Same as summary endpoint.

### Response[](https://docs.keeperhub.com/api/analytics#response-1)

```
{
  "buckets": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "runCount": 42,
      "successCount": 40,
      "failedCount": 2
    }
  ]
}
```

## Get Network Breakdown[](https://docs.keeperhub.com/api/analytics#get-network-breakdown)

```
GET /api/analytics/networks
```

Returns execution counts and gas usage grouped by blockchain network. Gas totals include both workflow executions and direct executions on each network.

### Query Parameters[](https://docs.keeperhub.com/api/analytics#query-parameters-2)

Same as summary endpoint.

### Response[](https://docs.keeperhub.com/api/analytics#response-2)

```
{
  "networks": [
    {
      "network": "ethereum",
      "runCount": 520,
      "gasUsedWei": "8000000000000000"
    },
    {
      "network": "base",
      "runCount": 380,
      "gasUsedWei": "2500000000000000"
    }
  ]
}
```

## List Runs[](https://docs.keeperhub.com/api/analytics#list-runs)

```
GET /api/analytics/runs
```

Returns a unified list of both workflow executions and direct executions with pagination.

### Query Parameters[](https://docs.keeperhub.com/api/analytics#query-parameters-3)

| Parameter | Type | Description |
| --- | --- | --- |
| `range` | string | Time range filter (same as summary) |
| `customStart` | string | ISO timestamp for custom range start |
| `customEnd` | string | ISO timestamp for custom range end |
| `status` | string | Filter by status: `pending`, `running`, `success`, `error` |
| `source` | string | Filter by source: `workflow`, `direct` |
| `limit` | number | Results per page (default: 50) |
| `cursor` | string | Pagination cursor from previous response |

### Response[](https://docs.keeperhub.com/api/analytics#response-3)

```
{
  "runs": [
    {
      "id": "exec_123",
      "source": "workflow",
      "workflowId": "wf_456",
      "workflowName": "Monitor ETH Balance",
      "status": "success",
      "createdAt": "2024-01-01T00:00:00Z",
      "completedAt": "2024-01-01T00:00:05Z",
      "durationMs": 5000
    },
    {
      "id": "direct_789",
      "source": "direct",
      "type": "transfer",
      "network": "ethereum",
      "status": "success",
      "transactionHash": "0x...",
      "gasUsedWei": "21000000000000",
      "createdAt": "2024-01-01T00:01:00Z",
      "completedAt": "2024-01-01T00:01:15Z"
    }
  ],
  "nextCursor": "cursor_abc123"
}
```

## Get Run Step Logs[](https://docs.keeperhub.com/api/analytics#get-run-step-logs)

```
GET /api/analytics/runs/{executionId}/steps
```

Returns detailed step-by-step logs for a specific execution.

### Response[](https://docs.keeperhub.com/api/analytics#response-4)

```
{
  "steps": [
    {
      "nodeId": "node_1",
      "nodeName": "Trigger",
      "status": "success",
      "input": {...},
      "output": {...},
      "durationMs": 120,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Get Spend Cap Data[](https://docs.keeperhub.com/api/analytics#get-spend-cap-data)

```
GET /api/analytics/spend-cap
```

Returns current spending status against configured daily spending caps.

### Response[](https://docs.keeperhub.com/api/analytics#response-5)

```
{
  "dailyCapWei": "100000000000000000",
  "spentTodayWei": "25000000000000000",
  "remainingWei": "75000000000000000",
  "percentUsed": 25.0
}
```

## Stream Analytics (SSE)[](https://docs.keeperhub.com/api/analytics#stream-analytics-sse)

```
GET /api/analytics/stream
```

Server-Sent Events endpoint for real-time analytics updates.

### Query Parameters[](https://docs.keeperhub.com/api/analytics#query-parameters-4)

Same as summary endpoint.

### Event Format[](https://docs.keeperhub.com/api/analytics#event-format)

```
data: {"type":"summary","data":{...}}

data: {"type":"summary","data":{...}}
```

The stream sends updated summary data every 2 seconds when changes are detected, with automatic reconnection and heartbeat support.
