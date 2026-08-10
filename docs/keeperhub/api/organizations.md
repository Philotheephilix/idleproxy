<!-- source: https://docs.keeperhub.com/api/organizations -->

# Organizations API

# Organizations API

Manage organization membership programmatically.

## Leave Organization[](https://docs.keeperhub.com/api/organizations#leave-organization)

```
POST /api/organizations/{organizationId}/leave
```

Remove yourself from an organization. If you are the sole owner, you must transfer ownership by providing `newOwnerMemberId` in the request body. The new owner must be an accepted member of the organization.

### Request Body[](https://docs.keeperhub.com/api/organizations#request-body)

```
{
  "newOwnerMemberId": "member_456"
}
```

The `newOwnerMemberId` field is only required when you are the last remaining owner.
