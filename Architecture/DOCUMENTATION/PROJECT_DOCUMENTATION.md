# Family Tree Platform

## Overview

The Family Tree Platform is a comprehensive web application built with Next.js that enables users to create, manage, and visualize family trees with advanced social features. The platform supports family relationship management, member profiles, social feeds, file uploads, and data export capabilities.

## Tech Stack

- **Frontend Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: Redux Toolkit + React Redux
- **Data Fetching**: TanStack React Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts/Visualization**: D3.js and Recharts
- **File Processing**: jsPDF and xlsx for exports
- **Notifications**: React Hot Toast
- **Build Tool**: Turbopack for development

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page with auth routing
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dialogs/          # Modal dialogs
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature-specific components
├── hooks/                # Custom React hooks
│   ├── api.ts           # API hooks using React Query
│   └── redux.ts         # Redux store hooks
├── lib/                  # Utility libraries
│   ├── api.ts           # API client configuration
│   └── utils.ts         # Utility functions
├── schemas/             # Zod validation schemas
├── store/               # Redux store configuration
│   ├── index.ts         # Store setup
│   └── slices/          # Redux slices
├── types/               # TypeScript type definitions
└── ...
```

## Core Features

### 1. Authentication System

- User registration and login
- JWT token-based authentication
- Support for email/phone authentication
- Family creation or joining via invitation

### 2. Family Management

- Create and manage multiple families
- Family hierarchy with sub-families
- Member roles (Admin, Member, Head, Viewer)
- Family invitations and member management

### 3. Member Profiles

- Comprehensive member information
- Relationship management (parent, spouse, child)
- Personal information (bio, birth details, occupation)
- Profile images and social links
- Member status tracking (Active, Inactive, Deceased, Archived)

### 4. Social Feed

- Post creation with text, images, and attachments
- Comment system with threading
- Like functionality for posts and comments
- Visibility controls (Public, Family, Sub-family)
- Real-time notifications

### 5. File Management

- File upload system
- Support for images, documents, videos, and audio
- Profile image management
- File attachments in posts and comments

### 6. Data Export

- Export family data to PDF or Excel
- Multiple export formats (folder tree, traditional, interactive)
- Configurable export options
- Include/exclude personal information and relationships

## API Endpoints

The application communicates with a backend API (default: `http://localhost:3001/api/v1`). All endpoints require authentication via JWT tokens except for authentication endpoints.

### Authentication Endpoints

#### POST `/auth/login`

Authenticate user with email/phone and password.

```typescript
interface LoginRequest {
  emailOrPhone: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

#### POST `/auth/register`

Register a new user account.

```typescript
interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  name: string;
  gender?: Gender;
  personalInfo?: Record<string, unknown>;
  registrationType: RegistrationType; // CREATE_FAMILY | JOIN_FAMILY
  familyName?: string;
  familyDescription?: string;
  invitationCode?: string;
}
```

### Member Management Endpoints

#### GET `/members/profile`

Get current user's profile with relationships.

```typescript
// Returns: MemberWithRelationships
interface MemberWithRelationships extends Member {
  parents: Member[];
  children: Member[];
  spouses: Member[];
  familyMemberships: FamilyMembership[];
}
```

#### PUT `/members/profile`

Update current user's profile.

```typescript
interface UpdateMemberRequest {
  name?: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: PersonalInfo;
}
```

#### POST `/members`

Create a new family member.

```typescript
interface CreateMemberRequest {
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: PersonalInfo;
  familyId: string;
  role?: FamilyRole;
  initialRelationships?: AddRelationshipRequest[];
}
```

#### GET `/members/family/{familyId}`

Get all members of a specific family.

```typescript
// Returns: Member[]
```

#### POST `/members/relationships`

Add a relationship between members.

```typescript
interface AddRelationshipRequest {
  relatedMemberId: string;
  relationshipType: RelationshipType; // PARENT | SPOUSE | CHILD
}
```

#### DELETE `/members/relationships`

Remove a relationship between members.

```typescript
// Same interface as AddRelationshipRequest
```

### Family Management Endpoints

#### GET `/families`

Get all families the user belongs to.

```typescript
// Returns: Family[]
interface Family {
  id: string;
  name: string;
  description?: string;
  isSubFamily: boolean;
  creatorId: string;
  headOfFamilyId?: string;
  parentFamilyId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### POST `/families`

Create a new family.

```typescript
interface CreateFamilyRequest {
  name: string;
  description?: string;
}
```

### Invitation System Endpoints

#### POST `/invitations`

Create a family invitation.

```typescript
interface CreateInvitationRequest {
  familyId: string;
  memberStub?: Record<string, unknown>;
}
```

#### GET `/invitations/my-invitations`

Get user's received invitations.

```typescript
// Returns: Invitation[]
interface Invitation {
  id: string;
  code: string;
  familyId: string;
  familyName: string;
  inviterName?: string;
  memberStub?: Record<string, unknown>;
  expiresAt: Date;
  status: string;
  createdAt: Date;
}
```

#### GET `/invitations/validate?code={code}`

Validate an invitation code.

```typescript
interface ValidationResponse {
  isValid: boolean;
  familyName: string;
  inviterName: string;
  memberStub?: Record<string, unknown>;
  expiresAt: Date;
}
```

### Social Feed Endpoints

#### GET `/posts`

Get posts with pagination and filtering.

```typescript
// Query parameters:
interface PostQueryParams {
  page?: number;
  limit?: number;
  familyId?: string;
  visibility?: PostVisibility; // PUBLIC | FAMILY | SUBFAMILY
  authorId?: string;
}

// Returns:
interface PostsResponse {
  posts: Post[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### GET `/posts/{postId}`

Get a specific post by ID.

```typescript
// Returns: Post
interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  fileAttachments: UploadedFile[];
  videoUrl?: string;
  visibility: PostVisibility;
  familyId?: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    personalInfo?: PersonalInfo;
  };
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### POST `/posts`

Create a new post.

```typescript
interface CreatePostRequest {
  content: string;
  imageUrls?: string[];
  fileAttachmentIds?: string[];
  videoUrl?: string;
  visibility: PostVisibility;
  familyId?: string;
}
```

#### PUT `/posts/{postId}`

Update an existing post.

```typescript
interface UpdatePostRequest {
  content?: string;
  imageUrls?: string[];
  fileAttachmentIds?: string[];
  videoUrl?: string;
  visibility?: PostVisibility;
}
```

#### DELETE `/posts/{postId}`

Delete a post.

#### POST `/posts/{postId}/like`

Like or unlike a post.

```typescript
interface LikeResponse {
  liked: boolean;
  message: string;
}
```

#### GET `/posts/{postId}/comments`

Get comments for a specific post.

```typescript
// Query parameters: { page?: number; limit?: number }
// Returns: Comment[]
interface Comment {
  id: string;
  content: string;
  imageUrl?: string;
  fileAttachment?: UploadedFile;
  postId: string;
  authorId: string;
  parentCommentId?: string;
  author: {
    id: string;
    name: string;
    personalInfo?: PersonalInfo;
  };
  likesCount: number;
  repliesCount: number;
  isLikedByCurrentUser: boolean;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### POST `/posts/{postId}/comments`

Create a comment on a post.

```typescript
interface CreateCommentRequest {
  content: string;
  imageUrl?: string;
  fileAttachmentId?: string;
  parentCommentId?: string; // For replies
}
```

#### PUT `/comments/{commentId}`

Update a comment.

```typescript
interface UpdateCommentRequest {
  content?: string;
  imageUrl?: string;
  fileAttachmentId?: string;
}
```

#### DELETE `/comments/{commentId}`

Delete a comment.

#### POST `/comments/{commentId}/like`

Like or unlike a comment.

```typescript
interface LikeResponse {
  liked: boolean;
  message: string;
}
```

### Notification Endpoints

#### GET `/notifications`

Get user notifications with pagination and filtering.

```typescript
// Query parameters:
interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

// Returns:
interface NotificationsResponse {
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

#### GET `/notifications/unread-count`

Get count of unread notifications.

```typescript
interface UnreadCountResponse {
  unreadCount: number;
}
```

#### PUT `/notifications/{notificationId}/read`

Mark a notification as read/unread.

```typescript
interface MarkReadRequest {
  isRead: boolean;
}
```

#### PUT `/notifications/mark-all-read`

Mark all notifications as read.

```typescript
interface MarkAllReadResponse {
  message: string;
  count: number;
}
```

#### DELETE `/notifications/{notificationId}`

Delete a notification.

### File Upload Endpoints

#### POST `/upload`

Upload a file.

```typescript
// Content-Type: multipart/form-data
// Body: FormData with 'file' field

interface FileUploadResponse {
  file: UploadedFile;
  url: string;
  message: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: FileType; // IMAGE | DOCUMENT | VIDEO | AUDIO
  uploadedBy: string;
  uploadedAt: Date;
}
```

#### POST `/upload/profile-image`

Upload a profile image.

```typescript
// Same as /upload but specifically for profile images
```

#### DELETE `/upload/{fileId}`

Delete an uploaded file.

### Export Endpoints

#### POST `/export/family-data`

Export family data to PDF or Excel.

```typescript
interface ExportRequest {
  format: "pdf" | "excel";
  scope: "current-family" | "all-families" | "selected-families";
  familyIds?: string[];
  config: ExportConfig;
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}

// Returns: Blob (PDF or Excel file)
```

#### GET `/export/folder-tree-data`

Get data for folder tree export format.

```typescript
// Returns: FolderTreeExportData
interface FolderTreeExportData {
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

## Data Types and Enums

### Enums

```typescript
enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DECEASED = "DECEASED",
  ARCHIVED = "ARCHIVED",
}

enum FamilyRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  HEAD = "HEAD",
  VIEWER = "VIEWER",
}

enum RelationshipType {
  PARENT = "PARENT",
  SPOUSE = "SPOUSE",
  CHILD = "CHILD",
}

enum PostVisibility {
  PUBLIC = "PUBLIC",
  FAMILY = "FAMILY",
  SUBFAMILY = "SUBFAMILY",
}

enum NotificationType {
  POST_LIKE = "POST_LIKE",
  COMMENT_LIKE = "COMMENT_LIKE",
  NEW_COMMENT = "NEW_COMMENT",
  NEW_POST = "NEW_POST",
  MENTION = "MENTION",
}

enum FileType {
  IMAGE = "IMAGE",
  DOCUMENT = "DOCUMENT",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
}
```

### Key Interfaces

```typescript
interface PersonalInfo {
  bio?: string;
  birthDate?: string;
  birthPlace?: string;
  occupation?: string;
  phoneNumber?: string;
  email?: string;
  profileImage?: string;
  profileImageId?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

interface User {
  id: string;
  email?: string;
  phone?: string;
  memberId?: string;
  member?: Member;
}
```

## Setup and Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Add other environment variables as needed
```

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

### Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Biome

## Architecture Patterns

### State Management

- **Redux Toolkit** for global state (authentication, user data)
- **React Query** for server state (API data, caching, synchronization)
- **Local State** with useState for component-specific state

### API Integration

- Centralized API client with automatic token handling
- React Query hooks for all API operations
- Automatic error handling and toast notifications
- Optimistic updates for better UX

### Component Structure

- Feature-based organization
- Reusable UI components with shadcn/ui
- Custom hooks for business logic
- TypeScript for type safety

### Authentication Flow

1. User logs in/registers
2. JWT tokens stored in localStorage
3. Automatic token refresh
4. Protected routes and API calls
5. Logout clears all stored data

## Security Considerations

- JWT tokens for authentication
- HTTPS recommended for production
- Input validation with Zod schemas
- File upload restrictions and validation
- Role-based access control for family features

## Performance Optimizations

- React Query for intelligent caching and background updates
- Code splitting with Next.js App Router
- Image optimization with Next.js Image component
- Lazy loading for heavy components
- Optimistic updates for immediate UI feedback

## Future Enhancements

- Real-time updates with WebSockets
- Advanced search and filtering
- Mobile app development
- Integration with genealogy databases
- Advanced visualization options
- Multi-language support

---

This documentation provides a comprehensive overview of the Family Tree Platform frontend application, its features, API endpoints, and technical implementation details.
