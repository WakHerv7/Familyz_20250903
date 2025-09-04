# Family Tree Platform - API Endpoints Documentation

## Overview

This document outlines the API endpoints used by the Family Tree Platform for retrieving and managing family tree data, member relationships, and tree visualization.

## Base API Configuration

### Backend Configuration

```env
# From .env file
PORT=3001
API_PREFIX="api"
API_VERSION="v1"
```

### Frontend Configuration

```javascript
// From src/lib/api.ts
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
```

### Full Base URL

```
http://localhost:3001/api/v1
```

## Primary Family Tree Endpoints

### 1. Member Profile with Relationships (Main Data Source)

**Endpoint:**

```
GET /api/v1/members/profile
```

**Purpose:**

- Gets current user's profile with ALL relationships
- Primary data source for family tree visualization
- Returns complete family tree data including parents, spouses, children

**Authentication:**

- JWT Bearer token required
- Must be authenticated user

**Response:**

```json
{
  "id": "user-id",
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "parents": [
    {
      "id": "david-id",
      "name": "David Smith",
      "gender": "MALE",
      "parents": [...],
      "spouses": [...],
      "children": [...]
    }
  ],
  "spouses": [...],
  "children": [...]
}
```

**Frontend Usage:**

```typescript
// From hooks/api.ts - useProfile() hook
const response = await apiClient.get<MemberWithRelationships>(
  "/members/profile"
);
```

---

### 2. Individual Member Details

**Endpoint:**

```
GET /api/v1/members/:id
```

**Purpose:**

- Get details of a specific family member
- Must be in the same family as the requesting user

**Parameters:**

- `id` (string): Member ID to fetch

**Authentication:**

- JWT Bearer token required
- Access control: Must be in same family

**Response:**

```json
{
  "id": "member-id",
  "name": "Sarah Johnson",
  "gender": "FEMALE",
  "personalInfo": {...},
  "parents": [...],
  "spouses": [...],
  "children": [...]
}
```

---

### 3. Family Members List

**Endpoint:**

```
GET /api/v1/members/family/:familyId
```

**Purpose:**

- Get all members in a specific family
- Used for family member selection and validation

**Parameters:**

- `familyId` (string): ID of the family

**Authentication:**

- JWT Bearer token required
- Must be a member of the specified family

**Response:**

```json
[
  {
    "id": "member-1",
    "name": "David Smith",
    "gender": "MALE",
    "status": "ACTIVE"
  },
  {
    "id": "member-2",
    "name": "Sarah Johnson",
    "gender": "FEMALE",
    "status": "ACTIVE"
  }
]
```

---

## Dedicated Tree Endpoints (Available but Not Currently Used)

### 4. Family Tree Visualization

**Endpoint:**

```
GET /api/v1/tree/:familyId
```

**Purpose:**

- Get complete family tree structure for visualization
- Dedicated tree endpoint (alternative to member profile)

**Parameters:**

- `familyId` (string): ID of the family
- `centerMemberId` (optional): ID of member to center the tree around

**Query Parameters:**

- `centerMemberId` (optional): Centers the tree on a specific member

**Example:**

```
GET /api/v1/tree/family-123?centerMemberId=member-456
```

---

### 5. Tree Statistics

**Endpoint:**

```
GET /api/v1/tree/:familyId/statistics
```

**Purpose:**

- Get statistical information about the family tree
- Generation counts, relationship metrics, etc.

**Response:**

```json
{
  "totalMembers": 15,
  "generations": 4,
  "relationships": {
    "parentChild": 14,
    "spouses": 7
  },
  "oldestMember": {
    "id": "david-id",
    "name": "David Smith",
    "age": 75
  }
}
```

---

### 6. Member Relationships Analysis

**Endpoint:**

```
GET /api/v1/tree/:familyId/relationships/:memberId
```

**Purpose:**

- Get detailed relationship information for a specific member
- Shows relationship paths and connections

**Response:**

```json
{
  "member": {
    "id": "member-id",
    "name": "Alex Johnson"
  },
  "directRelationships": [
    {
      "type": "parent",
      "member": { "id": "david-id", "name": "David Smith" }
    }
  ],
  "indirectRelationships": [...],
  "relationshipPath": [...]
}
```

---

### 7. Generation Breakdown

**Endpoint:**

```
GET /api/v1/tree/:familyId/generations
```

**Purpose:**

- Get members organized by generation levels
- Useful for timeline views and generation analysis

**Response:**

```json
{
  "-2": [
    { "id": "great-grandparent", "name": "Great Grandparent", "gender": "MALE" }
  ],
  "-1": [{ "id": "grandparent", "name": "Grandparent", "gender": "FEMALE" }],
  "0": [{ "id": "parent", "name": "Parent", "gender": "MALE" }],
  "1": [{ "id": "child", "name": "Child", "gender": "FEMALE" }]
}
```

---

### 8. Export Family Tree

**Endpoint:**

```
POST /api/v1/tree/export
```

**Purpose:**

- Export family tree data in various formats
- Supports JSON, CSV, and PDF formats

**Request Body:**

```json
{
  "familyId": "family-123",
  "format": "JSON",
  "includePrivate": false,
  "centerMemberId": "member-456"
}
```

**Supported Formats:**

- `JSON`: Complete tree data
- `CSV`: Tabular format for spreadsheet import
- `PDF`: Visual tree representation

---

## Authentication & Security

### JWT Authentication

All endpoints require JWT Bearer token authentication:

**Header:**

```
Authorization: Bearer <jwt-token>
```

### Access Control

- **Family Membership**: Users can only access data from families they belong to
- **Relationship Privacy**: Private information is filtered based on user permissions
- **Rate Limiting**: 20 requests per minute per user

---

## Data Flow Architecture

### Current Implementation

1. **Frontend calls**: `GET /api/v1/members/profile`
2. **Backend returns**: Complete member data with relationships
3. **Frontend processes**: Uses `buildFamilyTreeStructure()` to create tree
4. **Tree displays**: Shows hierarchical family relationships

### Alternative Tree-Centric Flow

1. **Frontend calls**: `GET /api/v1/tree/:familyId`
2. **Backend returns**: Optimized tree structure data
3. **Frontend renders**: Direct tree visualization

---

## Frontend Integration

### React Query Hooks

```typescript
// Main profile hook (currently used)
export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithRelationships>(
        "/members/profile"
      );
      return response;
    },
    enabled: isAuthenticated,
  });
};

// Family members hook
export const useFamilyMembers = (familyId: string) => {
  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const response = await apiClient.get<Member[]>(
        `/members/family/${familyId}`
      );
      return response;
    },
    enabled: isAuthenticated && !!familyId,
  });
};
```

### API Client Configuration

```typescript
// From src/lib/api.ts
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Automatic JWT token handling
  private getAuthToken(): string | null {
    return localStorage.getItem("accessToken");
  }
}
```

---

## Error Handling

### Common HTTP Status Codes

- `200`: Success
- `401`: Unauthorized (invalid/missing JWT)
- `403`: Forbidden (not a member of the family)
- `404`: Resource not found
- `429`: Rate limit exceeded

### Error Response Format

```json
{
  "statusCode": 403,
  "message": "Access denied - not a member of this family",
  "error": "Forbidden"
}
```

---

## Performance Considerations

### Caching Strategy

- **Profile Data**: Cached for 5 minutes
- **Family Members**: Cached per family ID
- **Tree Data**: Cached based on last modification

### Data Optimization

- **Relationship Depth**: Configurable relationship loading depth
- **Lazy Loading**: Children loaded on demand in tree view
- **Pagination**: Large family lists are paginated

---

## Development & Testing

### API Documentation

- **Swagger UI**: Available at `http://localhost:3001/docs`
- **Interactive Testing**: Test endpoints directly in browser
- **Authentication**: JWT tokens can be set in Swagger UI

### Test Endpoints

```bash
# Test member profile endpoint
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/v1/members/profile

# Test family tree endpoint
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/v1/tree/family-123
```

---

## Future Enhancements

### Planned Features

- **Real-time Updates**: WebSocket support for live tree updates
- **Advanced Filtering**: Filter by relationship types, generations
- **Tree Comparison**: Compare different family branches
- **Privacy Controls**: Granular permission system

### API Versioning

- Current: `v1`
- Future versions will maintain backward compatibility
- Deprecation notices provided for breaking changes

---

## Summary

**Primary Endpoint for Family Tree:**

```
GET http://localhost:3001/api/v1/members/profile
```

**Alternative Dedicated Endpoints:**

- `GET /api/v1/tree/:familyId` - Tree visualization
- `GET /api/v1/tree/:familyId/statistics` - Tree analytics
- `POST /api/v1/tree/export` - Data export

The current implementation using `/members/profile` provides all necessary relationship data in one authenticated API call, making it efficient for the family tree visualization requirements.
