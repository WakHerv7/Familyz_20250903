# Family Tree Platform - API Endpoints Documentation

## Overview

The Family Tree Platform provides a comprehensive REST API built with NestJS. All endpoints require authentication via JWT tokens except for authentication endpoints. The API follows RESTful conventions with consistent URL patterns, HTTP methods, and response formats.

**Base URL**: `http://localhost:3001/api/v1`

**Authentication**: Bearer token in Authorization header

```
Authorization: Bearer <jwt_token>
```

## 1. Authentication Endpoints

### POST `/auth/login`

Authenticate user with email/phone and password.

**Request Body**:

```typescript
{
  emailOrPhone: string; // Email or phone number
  password: string; // User password
}
```

**Response (200)**:

```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    memberId?: string;
    member?: {
      id: string;
      name: string;
      gender?: Gender;
      status: MemberStatus;
      personalInfo?: PersonalInfo;
    };
  };
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing required fields

### POST `/auth/register`

Register a new user account with dual registration modes.

**Request Body**:

```typescript
{
  email?: string;
  phone?: string;
  password: string;
  name: string;
  gender?: Gender;
  personalInfo?: PersonalInfo;
  registrationType: "CREATE_FAMILY" | "JOIN_FAMILY";
  familyName?: string;        // Required for CREATE_FAMILY
  familyDescription?: string; // Optional for CREATE_FAMILY
  invitationCode?: string;    // Required for JOIN_FAMILY
}
```

**Response (201)**:

```typescript
{
  accessToken: string;
  refreshToken: string;
  user: User;
  family?: Family;  // Only for CREATE_FAMILY
}
```

**Error Responses**:

- `400 Bad Request`: Invalid data or invitation code
- `409 Conflict`: Email/phone already exists
- `422 Unprocessable Entity`: Invalid invitation

### POST `/auth/refresh`

Refresh access token using refresh token.

**Request Body**:

```typescript
{
  refreshToken: string;
}
```

**Response (200)**:

```typescript
{
  accessToken: string;
  refreshToken: string; // New refresh token
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid refresh token

## 2. Member Management Endpoints

### GET `/members/profile`

Get current user's member profile with relationships.

**Response (200)**:

```typescript
{
  id: string;
  name: string;
  gender?: Gender;
  status: MemberStatus;
  personalInfo?: PersonalInfo;
  createdAt: Date;
  updatedAt: Date;
  parents: Member[];
  children: Member[];
  spouses: Member[];
  familyMemberships: FamilyMembership[];
}
```

### PUT `/members/profile`

Update current user's member profile.

**Request Body**:

```typescript
{
  name?: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: PersonalInfo;
}
```

**Response (200)**: Updated Member object

**Error Responses**:

- `400 Bad Request`: Invalid data
- `403 Forbidden`: Insufficient permissions

### POST `/members`

Create a new family member.

**Request Body**:

```typescript
{
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: PersonalInfo;
  familyId: string;
  role?: FamilyRole;
  initialRelationships?: {
    relatedMemberId: string;
    relationshipType: "PARENT" | "SPOUSE" | "CHILD";
  }[];
}
```

**Response (201)**: Created Member object

**Required Permissions**: Family Admin or Member

### GET `/members/family/{familyId}`

Get all members of a specific family.

**Query Parameters**:

- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 20)
- `status?: MemberStatus` - Filter by member status
- `search?: string` - Search by name

**Response (200)**:

```typescript
{
  members: Member[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### POST `/members/relationships`

Add a relationship between members.

**Request Body**:

```typescript
{
  relatedMemberId: string;
  relationshipType: "PARENT" | "SPOUSE" | "CHILD";
}
```

**Response (201)**: Success message

**Required Permissions**: Family Admin or relationship involves current user

### DELETE `/members/relationships`

Remove a relationship between members.

**Request Body**: Same as POST `/members/relationships`

**Response (200)**: Success message

## 3. Family Management Endpoints

### GET `/families`

Get all families the user belongs to.

**Response (200)**:

```typescript
{
  families: {
    id: string;
    name: string;
    description?: string;
    isSubFamily: boolean;
    creatorId: string;
    headOfFamilyId?: string;
    parentFamilyId?: string;
    createdAt: Date;
    updatedAt: Date;
    memberships: FamilyMembership[];
  }[];
}
```

### POST `/families`

Create a new family or sub-family.

**Request Body**:

```typescript
{
  name: string;
  description?: string;
  parentFamilyId?: string;  // For sub-family creation
}
```

**Response (201)**: Created Family object

**Required Permissions**: Family Admin (for sub-families)

### GET `/families/{familyId}`

Get detailed information about a specific family.

**Response (200)**:

```typescript
{
  id: string;
  name: string;
  description?: string;
  isSubFamily: boolean;
  creatorId: string;
  creator: Member;
  headOfFamilyId?: string;
  headOfFamily?: Member;
  parentFamilyId?: string;
  parentFamily?: Family;
  subFamilies: Family[];
  memberships: FamilyMembership[];
  members: Member[];
  createdAt: Date;
  updatedAt: Date;
}
```

### PUT `/families/{familyId}`

Update family information.

**Request Body**:

```typescript
{
  name?: string;
  description?: string;
  headOfFamilyId?: string;
}
```

**Response (200)**: Updated Family object

**Required Permissions**: Family Admin

### DELETE `/families/{familyId}`

Delete a family (only sub-families can be deleted).

**Response (200)**: Success message

**Required Permissions**: Family Admin

## 4. Invitation System Endpoints

### POST `/invitations`

Create a family invitation.

**Request Body**:

```typescript
{
  familyId: string;
  memberStub?: {
    name?: string;
    gender?: Gender;
    personalInfo?: PersonalInfo;
    relationship?: string;
  };
}
```

**Response (201)**:

```typescript
{
  id: string;
  code: string;
  familyId: string;
  familyName: string;
  inviterName: string;
  memberStub?: object;
  expiresAt: Date;
  status: InvitationStatus;
  createdAt: Date;
}
```

**Required Permissions**: Family Admin

### GET `/invitations/my-invitations`

Get user's received invitations.

**Response (200)**:

```typescript
{
  invitations: {
    id: string;
    code: string;
    familyId: string;
    familyName: string;
    inviterName?: string;
    memberStub?: object;
    expiresAt: Date;
    status: InvitationStatus;
    createdAt: Date;
  }[];
}
```

### GET `/invitations/validate`

Validate an invitation code.

**Query Parameters**:

- `code: string` - Invitation code to validate

**Response (200)**:

```typescript
{
  isValid: boolean;
  familyName?: string;
  inviterName?: string;
  memberStub?: object;
  expiresAt?: Date;
  error?: string;
}
```

### GET `/invitations/sent`

Get invitations sent by the current user.

**Query Parameters**:

- `familyId?: string` - Filter by family
- `status?: InvitationStatus` - Filter by status

**Response (200)**: Array of Invitation objects

### DELETE `/invitations/{invitationId}`

Revoke an invitation.

**Response (200)**: Success message

**Required Permissions**: Invitation creator or Family Admin

## 5. Social Feed Endpoints

### GET `/posts`

Get posts with pagination and filtering.

**Query Parameters**:

- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 10)
- `familyId?: string` - Filter by family
- `visibility?: PostVisibility` - Filter by visibility
- `authorId?: string` - Filter by author
- `search?: string` - Search in content

**Response (200)**:

```typescript
{
  posts: Post[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### GET `/posts/{postId}`

Get a specific post by ID.

**Response (200)**: Complete Post object with comments count and like status

### POST `/posts`

Create a new post.

**Request Body**:

```typescript
{
  content: string;
  imageUrls?: string[];
  fileAttachmentIds?: string[];
  videoUrl?: string;
  visibility: PostVisibility;
  familyId?: string;
}
```

**Response (201)**: Created Post object

### PUT `/posts/{postId}`

Update an existing post.

**Request Body**:

```typescript
{
  content?: string;
  imageUrls?: string[];
  fileAttachmentIds?: string[];
  videoUrl?: string;
  visibility?: PostVisibility;
}
```

**Response (200)**: Updated Post object

**Required Permissions**: Post author

### DELETE `/posts/{postId}`

Delete a post.

**Response (200)**: Success message

**Required Permissions**: Post author or Family Admin

### POST `/posts/{postId}/like`

Like or unlike a post.

**Response (200)**:

```typescript
{
  liked: boolean;
  message: string;
}
```

### GET `/posts/{postId}/comments`

Get comments for a specific post.

**Query Parameters**:

- `page?: number` - Page number
- `limit?: number` - Items per page

**Response (200)**: Array of Comment objects with nested replies

### POST `/posts/{postId}/comments`

Create a comment on a post.

**Request Body**:

```typescript
{
  content: string;
  imageUrl?: string;
  fileAttachmentId?: string;
  parentCommentId?: string;  // For replies
}
```

**Response (201)**: Created Comment object

### PUT `/comments/{commentId}`

Update a comment.

**Request Body**:

```typescript
{
  content?: string;
  imageUrl?: string;
  fileAttachmentId?: string;
}
```

**Response (200)**: Updated Comment object

**Required Permissions**: Comment author

### DELETE `/comments/{commentId}`

Delete a comment.

**Response (200)**: Success message

**Required Permissions**: Comment author or Family Admin

### POST `/comments/{commentId}/like`

Like or unlike a comment.

**Response (200)**:

```typescript
{
  liked: boolean;
  message: string;
}
```

## 6. Notification Endpoints

### GET `/notifications`

Get user notifications with pagination.

**Query Parameters**:

- `page?: number` - Page number
- `limit?: number` - Items per page
- `isRead?: boolean` - Filter by read status
- `type?: NotificationType` - Filter by notification type

**Response (200)**:

```typescript
{
  notifications: Notification[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}
```

### GET `/notifications/unread-count`

Get count of unread notifications.

**Response (200)**:

```typescript
{
  unreadCount: number;
}
```

### PUT `/notifications/{notificationId}/read`

Mark a notification as read/unread.

**Request Body**:

```typescript
{
  isRead: boolean;
}
```

**Response (200)**: Updated Notification object

### PUT `/notifications/mark-all-read`

Mark all notifications as read.

**Response (200)**:

```typescript
{
  message: string;
  count: number;
}
```

### DELETE `/notifications/{notificationId}`

Delete a notification.

**Response (200)**: Success message

## 7. File Upload Endpoints

### POST `/upload`

Upload a file.

**Content-Type**: `multipart/form-data`

**Form Data**:

- `file`: File to upload

**Response (201)**:

```typescript
{
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    type: FileType;
    uploadedBy: string;
    uploadedAt: Date;
  }
  url: string;
  message: string;
}
```

**Supported File Types**: Images, Documents, Videos, Audio

**File Size Limits**:

- Images: 10MB
- Documents: 25MB
- Videos: 100MB
- Audio: 50MB

### POST `/upload/profile-image`

Upload a profile image (optimized for profile pictures).

**Content-Type**: `multipart/form-data`

**Form Data**:

- `file`: Image file

**Response (201)**: Same as `/upload`

**Additional Processing**: Automatic resizing and optimization

### DELETE `/upload/{fileId}`

Delete an uploaded file.

**Response (200)**: Success message

**Required Permissions**: File owner

## 8. Export Endpoints

### POST `/export/family-data`

Export family data to PDF or Excel.

**Request Body**:

```typescript
{
  format: "pdf" | "excel";
  scope: "current-family" | "all-families" | "selected-families";
  familyIds?: string[];
  config: {
    includePersonalInfo: boolean;
    includeRelationships: boolean;
    includeContactInfo: boolean;
    includeProfileImages: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}
```

**Response (200)**: File download (PDF or Excel)

**Processing**: Asynchronous - may take time for large exports

### GET `/export/folder-tree-data`

Get data for folder tree export format.

**Query Parameters**:

- `familyId?: string` - Specific family ID
- `includeImages?: boolean` - Include profile images

**Response (200)**:

```typescript
{
  families: {
    id: string;
    name: string;
    members: {
      id: string;
      name: string;
      role: FamilyRole;
      generation: number;
      parents: Member[];
      children: Member[];
      spouses: Member[];
      personalInfo?: PersonalInfo;
    }[];
  }[];
  membersList: Member[];
  generatedAt: Date;
  exportConfig: ExportConfig;
}
```

## 9. Tree Visualization Endpoints

### GET `/tree/family/{familyId}`

Get family tree data for visualization.

**Query Parameters**:

- `depth?: number` - Relationship depth (default: unlimited)
- `includeInactive?: boolean` - Include inactive members
- `format?: string` - Data format (tree, graph, list)

**Response (200)**:

```typescript
{
  family: Family;
  members: Member[];
  relationships: {
    parentId: string;
    childId: string;
    type: string;
  }[];
  treeData: any;  // D3.js compatible format
}
```

### GET `/tree/member/{memberId}`

Get member's relationship network.

**Query Parameters**:

- `generations?: number` - Number of generations to include
- `direction?: string` - ancestors, descendants, both

**Response (200)**:

```typescript
{
  member: Member;
  ancestors: Member[];
  descendants: Member[];
  spouses: Member[];
  siblings: Member[];
  networkData: any;
}
```

## 10. Search Endpoints

### GET `/search/members`

Search for members across families.

**Query Parameters**:

- `query: string` - Search query
- `familyId?: string` - Limit to specific family
- `limit?: number` - Result limit
- `fields?: string[]` - Fields to search in

**Response (200)**:

```typescript
{
  members: Member[];
  total: number;
  query: string;
}
```

### GET `/search/posts`

Search posts and comments.

**Query Parameters**:

- `query: string` - Search query
- `familyId?: string` - Limit to specific family
- `type?: string` - posts, comments, or both

**Response (200)**:

```typescript
{
  results: {
    posts?: Post[];
    comments?: Comment[];
  };
  total: number;
}
```

## Error Response Format

All endpoints return errors in a consistent format:

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: Date;
  path: string;
}
```

## Common HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- **Authenticated requests**: 1000 requests per hour
- **File uploads**: 50 uploads per hour
- **Search requests**: 200 requests per hour
- **Export requests**: 10 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (1-based)
- `limit`: Items per page (max 100)

Pagination metadata is included in responses:

```typescript
{
  data: any[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Data Types and Enums

### Gender

```typescript
enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}
```

### MemberStatus

```typescript
enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DECEASED = "DECEASED",
  ARCHIVED = "ARCHIVED",
}
```

### FamilyRole

```typescript
enum FamilyRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  HEAD = "HEAD",
  VIEWER = "VIEWER",
}
```

### PostVisibility

```typescript
enum PostVisibility {
  PUBLIC = "PUBLIC",
  FAMILY = "FAMILY",
  SUBFAMILY = "SUBFAMILY",
}
```

### FileType

```typescript
enum FileType {
  IMAGE = "IMAGE",
  DOCUMENT = "DOCUMENT",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
}
```

This comprehensive API documentation covers all endpoints available in the Family Tree Platform, providing detailed information for integration and development purposes.
