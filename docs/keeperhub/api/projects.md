<!-- source: https://docs.keeperhub.com/api/projects -->

# Projects API

# Projects API

Organize workflows into projects for better management.

## List Projects[](https://docs.keeperhub.com/api/projects#list-projects)

```
GET /api/projects
```

Returns all projects for the current organization, including workflow counts.

### Response[](https://docs.keeperhub.com/api/projects#response)

```
[
  {
    "id": "proj_123",
    "name": "DeFi Monitoring",
    "description": "All DeFi-related workflows",
    "color": "#4A90D9",
    "organizationId": "org_456",
    "workflowCount": 5,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## Create Project[](https://docs.keeperhub.com/api/projects#create-project)

```
POST /api/projects
```

### Request Body[](https://docs.keeperhub.com/api/projects#request-body)

```
{
  "name": "My Project",
  "description": "Optional description",
  "color": "#7B61FF"
}
```

The `color` field is optional. If omitted, a color is automatically assigned from a default palette.

### Response[](https://docs.keeperhub.com/api/projects#response-1)

Returns the created project with `status: 201`.

## Update Project[](https://docs.keeperhub.com/api/projects#update-project)

```
PATCH /api/projects/{projectId}
```

### Request Body[](https://docs.keeperhub.com/api/projects#request-body-1)

All fields are optional. Only provided fields are updated.

```
{
  "name": "Updated Name",
  "description": "Updated description",
  "color": "#E06C75"
}
```

## Delete Project[](https://docs.keeperhub.com/api/projects#delete-project)

```
DELETE /api/projects/{projectId}
```

Deletes the project. Workflows assigned to this project are not deleted but become unassigned.
