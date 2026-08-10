<!-- source: https://docs.keeperhub.com/keeper-runs/status-logs -->

# Run Status and Logs

# Run Status and Logs

Every workflow execution generates detailed status information and logs that help you understand what happened during the run.

## Run Status Indicators[](https://docs.keeperhub.com/keeper-runs/status-logs#run-status-indicators)

### Successful Run[](https://docs.keeperhub.com/keeper-runs/status-logs#successful-run)

A green checkmark indicates the workflow completed successfully. All nodes executed without errors and the workflow reached its intended conclusion.

### Failed Run[](https://docs.keeperhub.com/keeper-runs/status-logs#failed-run)

A red indicator shows the workflow encountered an error. Expand the run details to identify which node failed and review the error information.

## Execution Logs Structure[](https://docs.keeperhub.com/keeper-runs/status-logs#execution-logs-structure)

Each run contains a complete execution trace showing how data flowed through your workflow.

### Trigger Log[](https://docs.keeperhub.com/keeper-runs/status-logs#trigger-log)

The first entry shows your trigger node:

-   Trigger type (Scheduled, Webhook, Event, Block, Manual)
-   Execution time (typically 0ms for triggers)
-   Trigger configuration used
-   Output data passed to the next node

**Event Triggers**: When a workflow is triggered by a blockchain event, the trigger output automatically includes block explorer links for transaction hashes and addresses. These appear as `transactionLink` and `addressLink` fields in the OUTPUT section, allowing you to click directly to the block explorer for verification.

### Action Logs[](https://docs.keeperhub.com/keeper-runs/status-logs#action-logs)

Each action node shows:

-   Action name and type
-   Execution duration in milliseconds
-   Input data received from previous nodes
-   Output data generated
-   Any errors encountered

### Condition Logs[](https://docs.keeperhub.com/keeper-runs/status-logs#condition-logs)

Condition nodes display:

-   Condition evaluated
-   Input values used for comparison
-   Result (true/false)
-   Which branch was taken

## Reading Node Data[](https://docs.keeperhub.com/keeper-runs/status-logs#reading-node-data)

### INPUT Section[](https://docs.keeperhub.com/keeper-runs/status-logs#input-section)

The INPUT section shows the data a node received. This typically includes:

-   Data from previous nodes in the workflow
-   Configuration values
-   Dynamic variables

Example INPUT for a Check Balance action:

```
{
  "network": "ethereum",
  "address": "0x1234...5678",
  "token": null
}
```

### OUTPUT Section[](https://docs.keeperhub.com/keeper-runs/status-logs#output-section)

The OUTPUT section shows what the node produced. This data becomes available to subsequent nodes.

Example OUTPUT from a Check Balance action:

```
{
  "balance": "1.5",
  "balanceWei": "1500000000000000000",
  "network": "ethereum",
  "address": "0x1234...5678"
}
```

## Log Timestamps[](https://docs.keeperhub.com/keeper-runs/status-logs#log-timestamps)

-   **Run timestamp**: When the workflow started
-   **Node execution time**: Duration of each individual node
-   **Total duration**: Sum of all node execution times plus overhead

## Data Flow Visualization[](https://docs.keeperhub.com/keeper-runs/status-logs#data-flow-visualization)

The expanded run view shows the sequence of execution:

1.  Trigger fires and produces initial data
2.  Each subsequent node receives input from previous nodes
3.  Conditions evaluate and route to appropriate branches
4.  Actions execute and generate outputs
5.  Final node completes the workflow

## Copying Log Data[](https://docs.keeperhub.com/keeper-runs/status-logs#copying-log-data)

Click the Copy button next to any INPUT or OUTPUT section to copy the JSON data. Use this for:

-   Debugging unexpected behavior
-   Sharing execution details with support
-   Verifying data transformations
