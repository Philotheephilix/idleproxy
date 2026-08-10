<!-- source: https://docs.keeperhub.com/getting-started/quickstart -->

# Quick Start Guide

# Quick Start Guide

Get up and running with KeeperHub in minutes by creating your first automation workflow.

## Step 1: Create Account[](https://docs.keeperhub.com/getting-started/quickstart#step-1-create-account)

Visit app.keeperhub.com and sign up with your email address. A Turnkey wallet is automatically provisioned for your organization once your email is verified, giving you a secure, non-custodial way to execute blockchain transactions.

## Step 2: Access Your Wallet[](https://docs.keeperhub.com/getting-started/quickstart#step-2-access-your-wallet)

Click your profile icon in the top right and select **Wallet** to view your Turnkey wallet address. Top up this wallet with ETH (on Mainnet or Sepolia testnet) to enable operations that require gas fees.

## Step 3: Create Your First Workflow[](https://docs.keeperhub.com/getting-started/quickstart#step-3-create-your-first-workflow)

Click the workflow dropdown in the top left and select **New Workflow** to open the visual workflow builder.

### The Workflow Canvas[](https://docs.keeperhub.com/getting-started/quickstart#the-workflow-canvas)

The workflow builder is a visual node-based editor where you build automations by connecting nodes:

-   **Trigger Nodes**: Start your workflow (Scheduled, Webhook, Event, Block, Manual)
-   **Action Nodes**: Perform operations (Check Balance, Send Email, Send Discord Message, etc.)
-   **Condition Nodes**: Add branching logic based on results

### Adding Nodes[](https://docs.keeperhub.com/getting-started/quickstart#adding-nodes)

You can add nodes to your workflow in multiple ways:

-   Click the **+** button in the top toolbar
-   Right-click on the canvas to open the context menu
-   Drag from an existing node’s connector point

### Example: Wallet Balance Watcher[](https://docs.keeperhub.com/getting-started/quickstart#example-wallet-balance-watcher)

Let’s create a workflow that monitors a wallet balance and sends notifications when it’s low:

1.  **Add a Scheduled Trigger**: Set it to run every 5 minutes
2.  **Add a Check Balance node**: Configure it to check a wallet’s ETH balance
3.  **Add a Low Balance Condition**: Set a threshold (e.g., balance < 0.1 ETH)
4.  **Add notification actions**: Connect Email and Discord nodes to alert when the condition is met

## Step 4: Configure Nodes[](https://docs.keeperhub.com/getting-started/quickstart#step-4-configure-nodes)

Click any node to open the configuration panel on the right side:

### For Web3 Actions (like Check Balance):[](https://docs.keeperhub.com/getting-started/quickstart#for-web3-actions-like-check-balance)

-   **Service**: Select the service type (Web3)
-   **Connection**: Choose your connected wallet
-   **Network**: Select the target network (for example Sepolia for testing, or any supported mainnet)
-   **Address**: Enter the wallet or contract address to monitor
-   **Label**: Give your node a descriptive name
-   **Description**: Optional notes about what this node does

### For Notification Actions:[](https://docs.keeperhub.com/getting-started/quickstart#for-notification-actions)

-   **Connection**: Select or create a connection (Email, Discord, Slack, Telegram)
-   **Message**: Configure the notification content

## Step 5: Set Up Connections[](https://docs.keeperhub.com/getting-started/quickstart#step-5-set-up-connections)

Before using notification actions, configure your connections:

1.  Click your profile icon and select **Connections**
2.  Add connections for the services you want to use:
    -   **Email**: Configure email delivery
    -   **Discord**: Add your Discord webhook URL
    -   **Slack**: Add your Slack bot token
    -   **Telegram**: Add your Telegram bot token

## Step 6: Enable and Run[](https://docs.keeperhub.com/getting-started/quickstart#step-6-enable-and-run)

1.  Click the **Enabled** toggle on each node you want active
2.  Click the green **Run** button in the top toolbar to test your workflow
3.  Your workflow will now execute based on the trigger configuration

## Using AI to Build Workflows[](https://docs.keeperhub.com/getting-started/quickstart#using-ai-to-build-workflows)

KeeperHub includes an AI assistant to help you build workflows. Click the **Ask AI…** input at the bottom of the canvas and describe what you want to automate in plain language.

Example prompts:

-   “Monitor my wallet and alert me on Discord if balance drops below 0.5 ETH”
-   “Check a smart contract function every hour and send an email with the result”

## What’s Next[](https://docs.keeperhub.com/getting-started/quickstart#whats-next)

-   Explore the **Hub** to discover and import workflow templates from the community
-   Learn more about [building workflows](https://docs.keeperhub.com/workflows/creating) for more complex automation patterns
-   Review [Security Best Practices](https://docs.keeperhub.com/practices/security) before deploying to Mainnet
