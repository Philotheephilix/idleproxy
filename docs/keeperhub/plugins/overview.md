<!-- source: https://docs.keeperhub.com/plugins/overview -->

# Plugins

# Plugins

Plugins provide the actions available in your workflows. Each plugin adds one or more actions that you can drag onto the workflow canvas and configure.

## Available Plugins[](https://docs.keeperhub.com/plugins/overview#available-plugins)

| Plugin | Category | Actions | Credentials Required |
| --- | --- | --- | --- |
| [Web3](https://docs.keeperhub.com/plugins/web3) | Blockchain | Balance checks, contract reads/writes, transfers, calldata decoding, risk assessment | Wallet (for writes) |
| [Code](https://docs.keeperhub.com/plugins/code) | Code | Execute custom JavaScript in a sandboxed VM | None |
| [Math](https://docs.keeperhub.com/plugins/math) | Math | Aggregation operations (sum, count, average, median, min, max, product) | None |
| [Safe](https://docs.keeperhub.com/plugins/safe) | Protocol | Safe multisig owners, threshold, nonce, module status, pending transactions | API key (for pending txs) |
| [Aave V3](https://docs.keeperhub.com/plugins/aave-v3) | Protocol | Supply, borrow, repay, collateral management, health factor monitoring | Wallet (for writes) |
| [Aave V4](https://docs.keeperhub.com/plugins/aave-v4) | Protocol | Hub-and-Spoke supply, borrow, repay, collateral management via the Lido Spoke | Wallet (for writes) |
| [Aerodrome](https://docs.keeperhub.com/plugins/aerodrome) | Protocol | Pool reserves, swap quotes, ve(3,3) voting, gauge management, AERO token operations | Wallet (for writes) |
| [Ajna](https://docs.keeperhub.com/plugins/ajna) | Protocol | Liquidation keeper operations, vault rebalancing, buffer management | Wallet (for writes) |
| [Chainlink](https://docs.keeperhub.com/plugins/chainlink) | Protocol | Oracle price feeds — latest prices, round data, decimals, feed metadata | None |
| [Chronicle](https://docs.keeperhub.com/plugins/chronicle) | Protocol | Verifiable oracle price feeds with Schnorr signature verification | None (whitelisted caller) |
| [Compound V3](https://docs.keeperhub.com/plugins/compound) | Protocol | Supply, withdraw, base/collateral/borrow balance monitoring | Wallet (for writes) |
| [CoW Swap](https://docs.keeperhub.com/plugins/cowswap) | Protocol | Order pre-signing, fill monitoring, conditional orders, order cancellation | Wallet (for writes) |
| [Curve](https://docs.keeperhub.com/plugins/curve) | Protocol | Pool swaps, LP management, virtual prices, CRV token operations | Wallet (for writes) |
| [Ethena](https://docs.keeperhub.com/plugins/ethena) | Protocol | sUSDe staking vault, cooldown/unstake, USDe and ENA balances | Wallet (for writes) |
| [Frax Ether V2](https://docs.keeperhub.com/plugins/frax-ether-v2) | Protocol | Liquid staking on Ethereum mainnet. Mint frxETH 1:1 from native ETH, or mint and stake directly into sfrxETH in one transaction | Wallet (for writes) |
| [Lido](https://docs.keeperhub.com/plugins/lido) | Protocol | Wrap/unwrap stETH to wstETH, exchange rates, balances across Ethereum, Base, Sepolia | Wallet (for writes) |
| [Morpho](https://docs.keeperhub.com/plugins/morpho) | Protocol | Supply, borrow, repay, liquidate, collateral management, position tracking, market monitoring | Wallet (for writes) |
| [Pendle](https://docs.keeperhub.com/plugins/pendle) | Protocol | Yield tokenization, market data, PT/YT/SY balances, mint/redeem | Wallet (for writes) |
| [Rocket Pool](https://docs.keeperhub.com/plugins/rocket-pool) | Protocol | rETH exchange rate, balances, total supply, ETH deposits and withdrawals | Wallet (for writes) |
| [Sky](https://docs.keeperhub.com/plugins/sky) | Protocol | USDS savings and staking vaults, token balances, approvals, DAI/MKR converters | Wallet (for writes) |
| [Spark](https://docs.keeperhub.com/plugins/spark) | Protocol | Lending, borrowing, sDAI savings, health factor monitoring | Wallet (for writes) |
| [Superfluid](https://docs.keeperhub.com/plugins/superfluid) | Protocol | Open/update/close money streams, distribution pools, SuperToken wrap/unwrap | Wallet (for writes) |
| [Uniswap](https://docs.keeperhub.com/plugins/uniswap) | Protocol | Pool discovery, LP position details, position NFT management | Wallet (for writes) |
| [Wrapped](https://docs.keeperhub.com/plugins/wrapped) | Protocol | Wrap/unwrap a chain’s native token into its wrapped ERC-20 form | Wallet (for writes) |
| [Yearn V3](https://docs.keeperhub.com/plugins/yearn-v3) | Protocol | ERC-4626 yield vaults, strategy monitoring, profit tracking | Wallet (for writes) |
| [Discord](https://docs.keeperhub.com/plugins/discord) | Notifications | Send messages to channels | Webhook URL |
| [Slack](https://docs.keeperhub.com/plugins/slack) | Notifications | Send messages to channels | Bot token |
| [Telegram](https://docs.keeperhub.com/plugins/telegram) | Notifications | Send messages to chats | Bot token |
| [SendGrid](https://docs.keeperhub.com/plugins/sendgrid) | Notifications | Send emails | API key |
| [Webhook](https://docs.keeperhub.com/plugins/webhook) | Integrations | Send HTTP requests to external services | None |
| [Hyperliquid](https://docs.keeperhub.com/plugins/hyperliquid) | Data | Read-only Info API queries: clearinghouse state, vault details, validators, funding history, spot deploy state, referrals, sub-accounts, active asset data | None |
| [Blockscout](https://docs.keeperhub.com/plugins/blockscout) | Data | Read-only block explorer queries: address balance, transaction details, token info | None (optional instance URL/API key) |

## How Plugins Work[](https://docs.keeperhub.com/plugins/overview#how-plugins-work)

1.  **Add an action** — Drag a plugin action from the action panel onto your workflow canvas
2.  **Configure inputs** — Set parameters in the right-side panel. Use `{{NodeName.field}}` to reference outputs from previous steps
3.  **Connect nodes** — Wire the action into your workflow flow using edges
4.  **Run** — Execute the workflow. Each action runs in sequence following the edges

## Plugin Categories[](https://docs.keeperhub.com/plugins/overview#plugin-categories)

### Blockchain (Web3)[](https://docs.keeperhub.com/plugins/overview#blockchain-web3)

Core on-chain operations: reading balances, calling smart contracts, transferring tokens, and security analysis. Read-only actions work without a wallet. Write actions require a connected Turnkey wallet.

### Code[](https://docs.keeperhub.com/plugins/overview#code)

Execute custom JavaScript in a sandboxed VM environment with access to workflow data via template variables. Use for data transformation, aggregation, external API calls, and complex conditional logic. No credentials required.

### Math[](https://docs.keeperhub.com/plugins/overview#math)

Pure computation nodes for aggregating numeric values from upstream nodes. Supports sum, count, average, median, min, max, and product operations with optional post-aggregation arithmetic. Automatically handles large integers using BigInt arithmetic to preserve precision.

### Security[](https://docs.keeperhub.com/plugins/overview#security)

Security-focused actions for transaction analysis, risk assessment, and Safe multisig monitoring. These actions use `maxRetries = 0` (fail-safe behavior) to ensure errors block execution rather than silently retrying.

### Notifications[](https://docs.keeperhub.com/plugins/overview#notifications)

Send alerts and messages through Discord, Slack, Telegram, email, and webhooks. Typically used as the final step in monitoring workflows to notify your team when conditions are met.

### Integrations[](https://docs.keeperhub.com/plugins/overview#integrations)

Connect to external services via webhooks and HTTP requests. Use these to trigger external systems, update dashboards, or integrate with third-party tools.
