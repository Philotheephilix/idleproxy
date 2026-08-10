<!-- source: https://docs.keeperhub.com/plugins/discord -->

# Discord Plugin

# Discord Plugin

Send messages to Discord channels using webhook URLs. No bot setup required.

## Actions[](https://docs.keeperhub.com/plugins/discord#actions)

| Action | Description |
| --- | --- |
| Send Message | Send a text message to a Discord channel |

## Setup[](https://docs.keeperhub.com/plugins/discord#setup)

1.  In Discord, go to **Server Settings > Integrations > Webhooks**
2.  Click **New Webhook**, select a channel, and copy the webhook URL
3.  In KeeperHub, go to **Connections > Add Connection > Discord**
4.  Paste the webhook URL and save

## Send Message[](https://docs.keeperhub.com/plugins/discord#send-message)

Post a message to a Discord channel.

**Inputs:** Message (supports `{{NodeName.field}}` variables)

**Outputs:** `success`, `error`

**When to use:** Alert your team about on-chain events, notify on balance changes, report workflow results, send security alerts.

**Example workflow:**

```
Schedule (every 5 min)
  -> Get Native Token Balance (treasury)
  -> Condition: balance < 10 ETH
  -> Discord: "Treasury balance low: {{CheckBalance.balance}} ETH"
```
