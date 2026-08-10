<!-- source: https://docs.keeperhub.com/api/user -->

# User API

# User API

Manage user profile and preferences.

> **Authentication.** Profile and wallet read operations in this section accept either a session cookie or an organization API key (`kh_`). Mutating operations require **session authentication** and reject API keys with `401`: profile mutation, password change, forgot-password, account deactivation, RPC preferences, and every wallet write operation (withdraw, share, refresh-share, export-key, active wallet switch, fee estimation). Address book entries are organization-scoped and accept either method. See [Authentication](https://docs.keeperhub.com/api/authentication#endpoint-scope) for the full scope rules.

## Get User Profile[](https://docs.keeperhub.com/api/user#get-user-profile)

```
GET /api/user
```

### Response[](https://docs.keeperhub.com/api/user#response)

```
{
  "id": "user_123",
  "name": "John Doe",
  "email": "[email protected]",
  "image": "https://...",
  "isAnonymous": false,
  "providerId": "google",
  "walletAddress": "0x..."
}
```

`walletAddress` is the **active organization’s** wallet, the address that signs and funds executions. It is not the address a wallet (`providerId: "siwe"`) user signed in with, and the two differ. It is the address to fund before a first write.

## Update User Profile[](https://docs.keeperhub.com/api/user#update-user-profile)

```
PATCH /api/user
```

Note: OAuth users cannot update email or name.

### Request Body[](https://docs.keeperhub.com/api/user#request-body)

```
{
  "name": "New Name"
}
```

## Get Wallet[](https://docs.keeperhub.com/api/user#get-wallet)

```
GET /api/user/wallet
```

Returns the Turnkey wallet for the authenticated user’s active organization. The wallet is organization-scoped, not per-user.

### Response[](https://docs.keeperhub.com/api/user#response-1)

```
{
  "hasWallet": true,
  "id": "wallet_...",
  "canExportKey": true,
  "isOwner": true,
  "walletAddress": "0x...",
  "walletId": "turnkey_wallet_...",
  "email": "[email protected]",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "organizationId": "org_...",
  "isActive": true
}
```

When the organization has no wallet yet, the response is `{ "hasWallet": false, "message": "No wallet found for this organization" }`.

Balances are not included here. Fetch them from `GET /api/user/wallet/balances`.

## RPC Preferences[](https://docs.keeperhub.com/api/user#rpc-preferences)

Manage custom RPC endpoints per chain.

### List RPC Preferences[](https://docs.keeperhub.com/api/user#list-rpc-preferences)

```
GET /api/user/rpc-preferences
```

### Response[](https://docs.keeperhub.com/api/user#response-2)

Returns two arrays. `preferences` lists the user’s saved overrides; `resolved` lists the effective RPC config for every chain after merging overrides with platform defaults. `source` is `"user"` when a preference is in effect, `"default"` otherwise.

```
{
  "preferences": [
    {
      "id": "pref_abc123",
      "chainId": 1,
      "primaryRpcUrl": "https://custom-rpc.example.com",
      "fallbackRpcUrl": "https://fallback.example.com",
      "createdAt": "2026-05-01T12:00:00.000Z",
      "updatedAt": "2026-05-01T12:00:00.000Z"
    }
  ],
  "resolved": [
    {
      "chainId": 1,
      "chainName": "Ethereum Mainnet",
      "primaryRpcUrl": "https://custom-rpc.example.com",
      "fallbackRpcUrl": "https://fallback.example.com",
      "primaryWssUrl": null,
      "fallbackWssUrl": null,
      "source": "user"
    }
  ]
}
```

### Get Chain RPC Preference[](https://docs.keeperhub.com/api/user#get-chain-rpc-preference)

```
GET /api/user/rpc-preferences/{chainId}
```

### Set or Update Chain RPC Preference[](https://docs.keeperhub.com/api/user#set-or-update-chain-rpc-preference)

```
PUT /api/user/rpc-preferences/{chainId}
```

#### Request Body[](https://docs.keeperhub.com/api/user#request-body-1)

```
{
  "primaryRpcUrl": "https://custom-rpc.example.com",
  "fallbackRpcUrl": "https://fallback.example.com"
}
```

`fallbackRpcUrl` is optional. To clear an existing preference, use the DELETE endpoint below instead of sending an empty body.

### Delete Chain RPC Preference[](https://docs.keeperhub.com/api/user#delete-chain-rpc-preference)

```
DELETE /api/user/rpc-preferences/{chainId}
```

Reverts to default RPC endpoints for the chain.

## Change Password[](https://docs.keeperhub.com/api/user#change-password)

```
POST /api/user/password
```

Change the password for a credential-based account. Requires the current password and a new password (minimum 8 characters). Not available for OAuth-only accounts.

### Request Body[](https://docs.keeperhub.com/api/user#request-body-2)

```
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

## Forgot Password[](https://docs.keeperhub.com/api/user#forgot-password)

```
POST /api/user/forgot-password
```

Handles password reset via OTP. Supports two actions controlled by the `action` field in the request body.

**Request OTP** (default when `action` is omitted or set to `"request"`):

```
{
  "email": "[email protected]"
}
```

**Reset password** (`action: "reset"`):

```
{
  "action": "reset",
  "email": "[email protected]",
  "otp": "123456",
  "newPassword": "new-password"
}
```

The OTP expires after 5 minutes. OAuth-only accounts receive a notification email instead of a reset code.

## Deactivate Account[](https://docs.keeperhub.com/api/user#deactivate-account)

```
POST /api/user/delete
```

Soft-deletes the authenticated user account. Requires a confirmation string in the request body. Invalidates all active sessions on success. Not available for anonymous users.

### Request Body[](https://docs.keeperhub.com/api/user#request-body-3)

```
{
  "confirmation": "DEACTIVATE"
}
```

## Address Book[](https://docs.keeperhub.com/api/user#address-book)

Manage saved Ethereum addresses scoped to the active organization. All address book endpoints require an active organization context.

### List Address Book Entries[](https://docs.keeperhub.com/api/user#list-address-book-entries)

```
GET /api/address-book
```

Returns all address book entries for the active organization, ordered by creation date (newest first).

### Create Address Book Entry[](https://docs.keeperhub.com/api/user#create-address-book-entry)

```
POST /api/address-book
```

#### Request Body[](https://docs.keeperhub.com/api/user#request-body-4)

```
{
  "label": "Treasury Wallet",
  "address": "0x..."
}
```

The address must be a valid Ethereum address.

### Update Address Book Entry[](https://docs.keeperhub.com/api/user#update-address-book-entry)

```
PATCH /api/address-book/{entryId}
```

Update the label or address of an existing entry. Both fields are optional.

### Delete Address Book Entry[](https://docs.keeperhub.com/api/user#delete-address-book-entry)

```
DELETE /api/address-book/{entryId}
```

Removes the entry from the organization address book.
