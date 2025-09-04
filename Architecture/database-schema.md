# Database Schema - Prisma ORM Structure

## Overview

The Family Tree Platform uses PostgreSQL as the primary database with Prisma ORM for type-safe database operations. The schema is designed to handle complex family relationships, hierarchical family structures, social features, and comprehensive member management.

## Database Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Core Entities

### 1. User Model

**Purpose**: Authentication and account management

```prisma
model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  phone         String?  @unique
  password      String
  emailVerified Boolean  @default(false) @map("email_verified")
  phoneVerified Boolean  @default(false) @map("phone_verified")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relationships
  memberId String? @unique @map("member_id")
  member   Member? @relation(fields: [memberId], references: [id])
  sentInvitations Invitation[] @relation("InviterUser")

  @@map("users")
}
```

**Key Features**:

- Flexible authentication (email or phone)
- One-to-one relationship with Member
- Invitation tracking
- Account status management

### 2. Member Model

**Purpose**: Core family tree entity representing individuals

```prisma
model Member {
  id        String   @id @default(uuid())
  name      String
  gender    Gender?
  status    MemberStatus @default(ACTIVE)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Flexible personal information
  personalInfo Json? @map("personal_info")

  // Family relationships - self-referential many-to-many
  parents  Member[] @relation("ParentChild")
  children Member[] @relation("ParentChild")
  spouses         Member[] @relation("Spouses")
  spousesReverse  Member[] @relation("Spouses")

  // Family memberships
  familyMemberships FamilyMembership[]

  // User account link
  user User?

  // Social features
  sentInvitations Invitation[] @relation("InviterMember")
  createdFamilies Family[] @relation("FamilyCreator")
  headedFamilies  Family[] @relation("FamilyHead")

  // Social feed relationships
  posts                   Post[]         @relation("PostAuthor")
  comments                Comment[]      @relation("CommentAuthor")
  postLikes               PostLike[]     @relation("PostLiker")
  commentLikes            CommentLike[]  @relation("CommentLiker")
  notifications           Notification[] @relation("NotificationRecipient")
  triggeredNotifications  Notification[] @relation("NotificationRelatedMember")

  // File uploads
  uploadedFiles File[] @relation("FileUploader")

  @@map("members")
}
```

**Key Features**:

- Self-referential relationships for complex family trees
- JSON storage for flexible personal information
- Multiple relationship types (parent-child, spouses)
- Integration with all platform features

### 3. Family Model

**Purpose**: Family groups with hierarchical structure

```prisma
model Family {
  id          String   @id @default(uuid())
  name        String
  description String?
  isSubFamily Boolean  @default(false) @map("is_sub_family")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Creator and leadership
  creatorId String @map("creator_id")
  creator   Member @relation("FamilyCreator", fields: [creatorId], references: [id])

  headOfFamilyId String? @map("head_of_family_id")
  headOfFamily   Member? @relation("FamilyHead", fields: [headOfFamilyId], references: [id])

  // Hierarchical structure
  parentFamilyId String? @map("parent_family_id")
  parentFamily   Family? @relation("FamilyHierarchy", fields: [parentFamilyId], references: [id])
  subFamilies    Family[] @relation("FamilyHierarchy")

  // Members and roles
  memberships FamilyMembership[]

  // Invitations
  invitations Invitation[]

  @@map("families")
}
```

**Key Features**:

- Hierarchical family structure (main families and sub-families)
- Creator and head of family roles
- Member role management through FamilyMembership

### 4. FamilyMembership Model

**Purpose**: Junction table for member-family relationships with roles

```prisma
model FamilyMembership {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relationships
  memberId String @map("member_id")
  member   Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  familyId String @map("family_id")
  family   Family @relation(fields: [familyId], references: [id], onDelete: Cascade)

  // Role and membership details
  role FamilyRole @default(MEMBER)
  type           MembershipType @default(MAIN)
  autoEnrolled   Boolean        @default(false) @map("auto_enrolled")
  manuallyEdited Boolean        @default(false) @map("manually_edited")
  isActive       Boolean        @default(true) @map("is_active")
  joinDate DateTime @default(now()) @map("join_date")

  @@unique([memberId, familyId])
  @@map("family_memberships")
}
```

**Key Features**:

- Role-based access control (Admin, Member, Head, Viewer)
- Automatic vs manual enrollment tracking
- Membership status management
- Join date tracking

### 5. Invitation Model

**Purpose**: Secure invitation system for family joining

```prisma
model Invitation {
  id        String   @id @default(uuid())
  code      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  expiresAt DateTime @map("expires_at")

  // Status tracking
  status    InvitationStatus @default(VALID)
  usedAt    DateTime?        @map("used_at")
  acceptedBy String?         @map("accepted_by")

  // Relationships
  familyId String @map("family_id")
  family   Family @relation(fields: [familyId], references: [id])

  inviterUserId   String? @map("inviter_user_id")
  inviterUser     User?   @relation("InviterUser", fields: [inviterUserId], references: [id])

  inviterMemberId String? @map("inviter_member_id")
  inviterMember   Member? @relation("InviterMember", fields: [inviterMemberId], references: [id])

  // Pre-filled member information
  memberStub Json? @map("member_stub")

  @@map("invitations")
}
```

**Key Features**:

- JWT-based secure invitation codes
- Expiration and status tracking
- Member profile stubs for invited users
- Tracking of who sent the invitation

## Social Features Models

### 6. Post Model

**Purpose**: Social feed posts with rich content

```prisma
model Post {
  id        String   @id @default(uuid())
  content   String
  imageUrls String[] @map("image_urls")
  videoUrl  String?  @map("video_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Privacy controls
  visibility PostVisibility @default(FAMILY)

  // Author and context
  authorId String @map("author_id")
  author   Member @relation("PostAuthor", fields: [authorId], references: [id], onDelete: Cascade)

  familyId String? @map("family_id")

  // Social interactions
  comments   Comment[]  @relation("PostComments")
  likes      PostLike[] @relation("PostLikes")
  likesCount Int        @default(0) @map("likes_count")

  // Edit tracking
  editHistory Json? @map("edit_history")

  // File attachments
  fileAttachments PostFileAttachment[]

  @@map("posts")
}
```

**Key Features**:

- Multi-media content support (images, videos, files)
- Privacy controls (Public, Family, Sub-family)
- Social interactions (likes, comments)
- Edit history tracking
- File attachment system

### 7. Comment Model

**Purpose**: Threaded comments system

```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  imageUrl  String?  @map("image_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relationships
  postId String @map("post_id")
  post   Post   @relation("PostComments", fields: [postId], references: [id], onDelete: Cascade)

  authorId String @map("author_id")
  author   Member @relation("CommentAuthor", fields: [authorId], references: [id], onDelete: Cascade)

  // Nested structure
  parentCommentId String?   @map("parent_comment_id")
  parentComment   Comment?  @relation("CommentReplies", fields: [parentCommentId], references: [id])
  replies         Comment[] @relation("CommentReplies")

  // Social interactions
  likes      CommentLike[] @relation("CommentLikes")
  likesCount Int           @default(0) @map("likes_count")

  // File attachments
  fileAttachments CommentFileAttachment[]

  @@map("comments")
}
```

**Key Features**:

- Threaded comment system with replies
- Image support in comments
- Like functionality
- File attachments

### 8. Like Models (PostLike & CommentLike)

**Purpose**: Social interaction tracking

```prisma
model PostLike {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")

  postId String @map("post_id")
  post   Post   @relation("PostLikes", fields: [postId], references: [id], onDelete: Cascade)

  memberId String @map("member_id")
  member   Member @relation("PostLiker", fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([postId, memberId])
  @@map("post_likes")
}

model CommentLike {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")

  commentId String  @map("comment_id")
  comment   Comment @relation("CommentLikes", fields: [commentId], references: [id], onDelete: Cascade)

  memberId String @map("member_id")
  member   Member @relation("CommentLiker", fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([commentId, memberId])
  @@map("comment_likes")
}
```

**Key Features**:

- Unique constraints prevent duplicate likes
- Cascade deletion for data integrity
- Timestamp tracking

### 9. Notification Model

**Purpose**: User notification system

```prisma
model Notification {
  id        String   @id @default(uuid())
  type      NotificationType
  message   String
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  // Recipient
  memberId String @map("member_id")
  member   Member @relation("NotificationRecipient", fields: [memberId], references: [id], onDelete: Cascade)

  // Related entities
  relatedPostId    String? @map("related_post_id")
  relatedCommentId String? @map("related_comment_id")
  relatedMemberId  String? @map("related_member_id")
  relatedMember    Member? @relation("NotificationRelatedMember", fields: [relatedMemberId], references: [id], onDelete: Cascade)

  // Additional data
  metadata Json?

  @@map("notifications")
}
```

**Key Features**:

- Multiple notification types
- Polymorphic relationships to related entities
- Read status tracking
- JSON metadata for flexible content

## File Management Models

### 10. File Model

**Purpose**: File upload and storage management

```prisma
model File {
  id           String   @id @default(uuid())
  filename     String
  originalName String   @map("original_name")
  mimeType     String   @map("mime_type")
  size         Int
  url          String
  type         FileType
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Upload tracking
  uploadedBy String @map("uploaded_by")
  uploader   Member @relation("FileUploader", fields: [uploadedBy], references: [id], onDelete: Cascade)

  // Usage relationships
  postAttachments    PostFileAttachment[]
  commentAttachments CommentFileAttachment[]

  @@map("files")
}
```

**Key Features**:

- Multiple file type support
- Original and generated filename tracking
- File size and MIME type validation
- Public URL generation

### 11. File Attachment Models

**Purpose**: Junction tables for file-post/comment relationships

```prisma
model PostFileAttachment {
  id       String @id @default(uuid())
  postId   String @map("post_id")
  fileId   String @map("file_id")
  post     Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  file     File   @relation(fields: [fileId], references: [id], onDelete: Cascade)
  order    Int    @default(0)

  @@unique([postId, fileId])
  @@map("post_file_attachments")
}

model CommentFileAttachment {
  id        String  @id @default(uuid())
  commentId String  @map("comment_id")
  fileId    String  @map("file_id")
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  file      File    @relation(fields: [fileId], references: [id], onDelete: Cascade)

  @@unique([commentId, fileId])
  @@map("comment_file_attachments")
}
```

**Key Features**:

- Unique constraints prevent duplicate attachments
- Cascade deletion for data integrity
- Order tracking for post attachments

## Enums

### Gender Enum

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}
```

### Member Status Enum

```prisma
enum MemberStatus {
  ACTIVE
  INACTIVE
  DECEASED
  ARCHIVED
}
```

### Family Role Enum

```prisma
enum FamilyRole {
  ADMIN     // Full management permissions
  MEMBER    // Standard family member
  HEAD      // Sub-family leadership
  VIEWER    // Read-only access
}
```

### Membership Type Enum

```prisma
enum MembershipType {
  MAIN // Main family membership
  SUB  // Sub-family membership
}
```

### Invitation Status Enum

```prisma
enum InvitationStatus {
  VALID
  USED
  EXPIRED
  REVOKED
}
```

### Post Visibility Enum

```prisma
enum PostVisibility {
  PUBLIC     // All app users
  FAMILY     // Family members only
  SUBFAMILY  // Sub-family members only
}
```

### Notification Type Enum

```prisma
enum NotificationType {
  POST_LIKE
  COMMENT_LIKE
  NEW_COMMENT
  NEW_POST
  MENTION
}
```

### File Type Enum

```prisma
enum FileType {
  IMAGE
  DOCUMENT
  VIDEO
  AUDIO
}
```

## Database Relationships

### Core Relationship Diagram

```
User (1:1) ─── Member (M:M) ─── FamilyMembership (M:1) Family
                    │                    │
                    │                    │
                    ▼                    ▼
               Relationships        Invitations
               (Parent-Child,
                Spouses)

Member ─── Posts ─── Comments ─── Likes
    │        │          │
    │        │          │
    ▼        ▼          ▼
Notifications  Files  Attachments
```

### Key Relationship Patterns

1. **Self-Referential Relationships**: Members can have complex relationships with other members (parents, children, spouses)
2. **Hierarchical Structures**: Families can have parent-child relationships creating sub-family hierarchies
3. **Junction Tables**: FamilyMembership, PostLike, CommentLike, and file attachment tables handle many-to-many relationships
4. **Polymorphic Relationships**: Notifications can reference different entity types
5. **Cascade Deletions**: Maintains referential integrity when entities are removed

## Indexing Strategy

### Recommended Indexes

- **User Authentication**: `email`, `phone` for fast lookups
- **Member Relationships**: Composite indexes on relationship junction tables
- **Family Memberships**: `memberId`, `familyId` for role-based queries
- **Social Features**: `authorId`, `createdAt` for timeline queries
- **Search Optimization**: Full-text indexes on names and content

## Data Integrity

### Constraints

- Unique constraints on critical fields (email, phone, invitation codes)
- Foreign key constraints with cascade/delete rules
- Check constraints on enum values
- Not null constraints on required fields

### Data Validation

- Application-level validation using class-validator
- Database-level constraints for data integrity
- JSON schema validation for flexible fields

## Migration Strategy

### Prisma Migrations

- Version-controlled schema changes
- Automatic migration generation
- Rollback capabilities
- Environment-specific migrations

### Data Seeding

- Sample family data for development
- Test user accounts
- Demo content for social features

This database schema provides a robust foundation for the Family Tree Platform, supporting complex family relationships, social interactions, and scalable data management while maintaining data integrity and performance.
