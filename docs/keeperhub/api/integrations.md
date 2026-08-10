<!-- source: https://docs.keeperhub.com/api/integrations -->

# Integrations API

# Integrations API

Manage integrations for notifications and external services.

## Supported Integration Types[](https://docs.keeperhub.com/api/integrations#supported-integration-types)

| Type | Description |
| --- | --- |
| `discord` | Discord webhook notifications |
| `slack` | Slack workspace integration |
| `telegram` | Telegram bot messaging |
| `sendgrid` | Email via SendGrid |
| `resend` | Email via Resend |
| `safe` | Safe multisig API integration |
| `webhook` | Custom HTTP webhooks |
| `web3` | Web3 wallet connections |
| `ai-gateway` | AI service integrations |

## List Integrations[](https://docs.keeperhub.com/api/integrations#list-integrations)

```
GET /api/integrations
```

### Query Parameters[](https://docs.keeperhub.com/api/integrations#query-parameters)

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | string | Filter by integration type |

### Response[](https://docs.keeperhub.com/api/integrations#response)

```
{
  "data": [
    {
      "id": "int_123",
      "name": "My Discord",
      "type": "discord",
      "isManaged": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

Note: Integration config is excluded from list responses for security.

## Get Integration[](https://docs.keeperhub.com/api/integrations#get-integration)

```
GET /api/integrations/{integrationId}
```

Returns full integration details including configuration.

## Create Integration[](https://docs.keeperhub.com/api/integrations#create-integration)

```
POST /api/integrations
```

### Request Body[](https://docs.keeperhub.com/api/integrations#request-body)

```
{
  "name": "My Slack Integration",
  "type": "slack",
  "config": {
    "webhookUrl": "https://hooks.slack.com/..."
  }
}
```

## Update Integration[](https://docs.keeperhub.com/api/integrations#update-integration)

```
PUT /api/integrations/{integrationId}
```

### Request Body[](https://docs.keeperhub.com/api/integrations#request-body-1)

```
{
  "name": "Updated Name",
  "config": {
    "webhookUrl": "https://new-webhook-url..."
  }
}
```

## Delete Integration[](https://docs.keeperhub.com/api/integrations#delete-integration)

```
DELETE /api/integrations/{integrationId}
```

## Test Integration[](https://docs.keeperhub.com/api/integrations#test-integration)

```
POST /api/integrations/{integrationId}/test
```

Tests the integration credentials and connectivity.

### Request Body (Optional)[](https://docs.keeperhub.com/api/integrations#request-body-optional)

```
{
  "configOverrides": {
    "webhookUrl": "https://test-webhook-url..."
  }
}
```

The `configOverrides` field allows testing with temporary configuration values without modifying the saved integration.

### Response[](https://docs.keeperhub.com/api/integrations#response-1)

```
{
  "status": "success",
  "message": "Integration test successful"
}
```
