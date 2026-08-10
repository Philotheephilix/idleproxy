<!-- source: https://docs.keeperhub.com/keeper-runs/monitoring -->

# Performance Monitoring

# Performance Monitoring

KeeperHub provides comprehensive performance monitoring and analytics for workflows and direct executions through the Analytics API and dashboard.

## Analytics Dashboard[](https://docs.keeperhub.com/keeper-runs/monitoring#analytics-dashboard)

The analytics dashboard provides real-time insights into:

-   **Success Rate Metrics**: Percentage of successful runs over time
-   **Execution Time Trends**: Average and peak execution durations
-   **Run Volume Statistics**: Number of executions per workflow
-   **Error Rate Tracking**: Failure patterns and frequencies

## Gas Usage Analytics[](https://docs.keeperhub.com/keeper-runs/monitoring#gas-usage-analytics)

Track blockchain transaction costs across all executions:

-   Total gas spent per network
-   Gas costs over time
-   Network fee comparisons
-   Spending cap monitoring

## Analytics API[](https://docs.keeperhub.com/keeper-runs/monitoring#analytics-api)

Programmatic access to analytics data is available through the [Analytics API](https://docs.keeperhub.com/api/analytics). Key endpoints include:

-   **Summary Metrics**: Aggregated statistics for run counts, success rates, and gas usage
-   **Time Series Data**: Historical trends for charting execution volume
-   **Network Breakdown**: Per-network execution and gas usage statistics
-   **Run Logs**: Unified list of workflow and direct executions with filtering
-   **Real-time Streaming**: Server-Sent Events for live analytics updates

## Run History[](https://docs.keeperhub.com/keeper-runs/monitoring#run-history)

View execution history in the Runs panel:

-   Individual run status and timing
-   Step-by-step execution logs
-   Input and output data for each node
-   Error messages and stack traces
-   Transaction hashes and block explorer links

## Node Performance[](https://docs.keeperhub.com/keeper-runs/monitoring#node-performance)

Track performance at the node level:

-   Execution time per node
-   Success/failure rates per step
-   Slowest nodes identification
-   Bottleneck analysis

## Spending Caps[](https://docs.keeperhub.com/keeper-runs/monitoring#spending-caps)

Organizations can configure a daily cap on the native token value moved by direct executions (transfers), independent of gas:

-   Set the maximum daily value in wei
-   Monitor current usage against the cap
-   Automatic enforcement on direct executions
-   Real-time spending alerts

See [Analytics API](https://docs.keeperhub.com/api/analytics) for details on accessing spending cap data programmatically.

## Time Ranges[](https://docs.keeperhub.com/keeper-runs/monitoring#time-ranges)

Analytics support multiple time ranges:

-   Last 24 hours
-   Last 7 days
-   Last 30 days (default)
-   Last 90 days
-   Custom date ranges
