// Enums
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DECEASED = 'DECEASED',
  ARCHIVED = 'ARCHIVED',
}

export enum FamilyRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  HEAD = 'HEAD',
  VIEWER = 'VIEWER',
}

export enum RelationshipType {
  PARENT = 'PARENT',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
}

export enum RegistrationType {
  CREATE_FAMILY = 'CREATE_FAMILY',
  JOIN_FAMILY = 'JOIN_FAMILY',
}

// Social Feed Enums
export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  FAMILY = 'FAMILY',
  SUBFAMILY = 'SUBFAMILY',
}

export enum NotificationType {
  POST_LIKE = 'POST_LIKE',
  COMMENT_LIKE = 'COMMENT_LIKE',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_POST = 'NEW_POST',
  MENTION = 'MENTION',
}

// File Upload Types
export enum FileType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

// User and Auth types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  memberId?: string;
  member?: Member;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  name: string;
  gender?: Gender;
  personalInfo?: Record<string, unknown>;
  registrationType: RegistrationType;
  familyName?: string;
  familyDescription?: string;
  invitationCode?: string;
}

export interface LoginRequest {
  emailOrPhone: string;
  password: string;
}

// File Upload interfaces
export interface UploadedFile {
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

export interface FileUploadResponse {
  file: UploadedFile;
  url: string;
  message: string;
}

// Personal Info interface
export interface PersonalInfo {
  bio?: string;
  birthDate?: string;
  birthPlace?: string;
  occupation?: string;
  phoneNumber?: string;
  email?: string;
  profileImage?: string; // Enhanced: Profile image URL
  profileImageId?: string; // File ID for uploaded image
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

// Member types
export interface Member {
  id: string;
  name: string;
  gender?: Gender;
  status: MemberStatus;
  personalInfo?: PersonalInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberWithRelationships extends Member {
  parents: Member[];
  children: Member[];
  spouses: Member[];
  familyMemberships: FamilyMembership[];
}

export interface FamilyMembership {
  id: string;
  familyId: string;
  familyName: string;
  role: FamilyRole;
  type: string;
  autoEnrolled: boolean;
  manuallyEdited: boolean;
  isActive: boolean;
  joinDate: Date;
}

// Family types
export interface Family {
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

// Relationship types
export interface AddRelationshipRequest {
  relatedMemberId: string;
  relationshipType: RelationshipType;
}

export interface UpdateMemberRequest {
  name?: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: PersonalInfo;
}

export interface CreateMemberRequest {
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  personalInfo?: PersonalInfo;
  familyId: string;
  role?: FamilyRole;
  initialRelationships?: AddRelationshipRequest[];
}

// Invitation types
export interface Invitation {
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

// Enhanced Social Feed Types
export interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  fileAttachments: UploadedFile[]; // Enhanced: File attachments
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
  editHistory?: Record<string, any>;
}

export interface Comment {
  id: string;
  content: string;
  imageUrl?: string;
  fileAttachment?: UploadedFile; // Enhanced: File attachment
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

export interface PostLike {
  id: string;
  postId: string;
  memberId: string;
  createdAt: Date;
}

export interface CommentLike {
  id: string;
  commentId: string;
  memberId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  memberId: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  relatedMemberId?: string;
  relatedMember?: {
    id: string;
    name: string;
    personalInfo?: PersonalInfo;
  };
  relatedPost?: {
    id: string;
    content: string;
  };
  relatedComment?: {
    id: string;
    content: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Enhanced Social Feed Request Types
export interface CreatePostRequest {
  content: string;
  imageUrls?: string[];
  fileAttachmentIds?: string[]; // Enhanced: File attachment IDs
  videoUrl?: string;
  visibility: PostVisibility;
  familyId?: string;
}

export interface UpdatePostRequest {
  content?: string;
  imageUrls?: string[];
  fileAttachmentIds?: string[]; // Enhanced: File attachment IDs
  videoUrl?: string;
  visibility?: PostVisibility;
}

export interface CreateCommentRequest {
  content: string;
  imageUrl?: string;
  fileAttachmentId?: string; // Enhanced: File attachment ID
  parentCommentId?: string;
}

export interface PostQueryParams {
  page?: number;
  limit?: number;
  familyId?: string;
  visibility?: PostVisibility;
  authorId?: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

// Enhanced Export Types
export interface ExportConfig {
  formats: ('pdf' | 'excel')[];
  familyTree: {
    structure: 'folderTree' | 'traditional' | 'interactive';
    includeMembersList: boolean;
    memberDetails: ('parent' | 'children' | 'spouses' | 'personalInfo' | 'contact')[];
  };
}

export interface FolderTreeExportData {
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

export interface ExportRequest {
  format: 'pdf' | 'excel';
  scope: 'current-family' | 'all-families' | 'selected-families';
  familyIds?: string[];
  config: ExportConfig;
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}

// Tree visualization types
export interface TreeNode {
  id: string;
  name: string;
  gender?: Gender;
  status: MemberStatus;
  x: number;
  y: number;
  level: number;
  parents: string[];
  children: string[];
  spouses: string[];
}

export interface TreeData {
  nodes: TreeNode[];
  connections: {
    from: string;
    to: string;
    type: 'parent' | 'spouse' | 'child';
  }[];
}
