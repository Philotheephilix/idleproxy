<!-- source: https://docs.keeperhub.com/api/tags -->

# Tags API

# Tags API

Manage workflow organization tags.

## Organization Tags[](https://docs.keeperhub.com/api/tags#organization-tags)

Organization tags are private labels for categorizing workflows within your organization.

### List Organization Tags[](https://docs.keeperhub.com/api/tags#list-organization-tags)

```
GET /api/tags
```

Returns all tags for the current organization, including workflow counts.

#### Response[](https://docs.keeperhub.com/api/tags#response)

```
[
  {
    "id": "tag_123",
    "name": "Production",
    "color": "#4A90D9",
    "organizationId": "org_456",
    "userId": "user_789",
    "workflowCount": 12,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Organization Tag[](https://docs.keeperhub.com/api/tags#create-organization-tag)

```
POST /api/tags
```

#### Request Body[](https://docs.keeperhub.com/api/tags#request-body)

```
{
  "name": "My Tag",
  "color": "#7B61FF"
}
```

Both fields are required.

### Update Organization Tag[](https://docs.keeperhub.com/api/tags#update-organization-tag)

```
PATCH /api/tags/{tagId}
```

#### Request Body[](https://docs.keeperhub.com/api/tags#request-body-1)

```
{
  "name": "Updated Name",
  "color": "#E06C75"
}
```

Both fields are optional. Only provided fields are updated.

### Delete Organization Tag[](https://docs.keeperhub.com/api/tags#delete-organization-tag)

```
DELETE /api/tags/{tagId}
```

Deletes the tag. Workflows assigned to this tag become untagged.

## Public Tags[](https://docs.keeperhub.com/api/tags#public-tags)

Public tags are system-wide labels used for categorizing public workflows in the hub.

### List Public Tags[](https://docs.keeperhub.com/api/tags#list-public-tags)

```
GET /api/public-tags
```

Returns all public tags with workflow counts.

#### Response[](https://docs.keeperhub.com/api/tags#response-1)

```
[
  {
    "id": "tag_1",
    "name": "DeFi",
    "slug": "defi",
    "workflowCount": 42,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Public Tag[](https://docs.keeperhub.com/api/tags#create-public-tag)

```
POST /api/public-tags
```

Creates a new public tag. Requires authentication.

#### Request Body[](https://docs.keeperhub.com/api/tags#request-body-2)

```
{
  "name": "NFT"
}
```

The slug is automatically generated from the name (e.g., “NFT” becomes “nft”).
