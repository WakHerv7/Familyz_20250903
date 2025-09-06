export enum FamilyPermission {
  // Basic viewing permissions
  VIEW_TREE = "view_tree",
  VIEW_MEMBERS = "view_members",
  VIEW_FAMILY_INFO = "view_family_info",

  // Member management permissions
  ADD_MEMBERS = "add_members",
  EDIT_MEMBERS = "edit_members",
  EDIT_OWN_PROFILE = "edit_own_profile",
  REMOVE_MEMBERS = "remove_members",

  // Invitation permissions
  MANAGE_INVITATIONS = "manage_invitations",
  SEND_INVITATIONS = "send_invitations",
  CANCEL_INVITATIONS = "cancel_invitations",

  // Administrative permissions
  MANAGE_PERMISSIONS = "manage_permissions",
  MANAGE_FAMILY_SETTINGS = "manage_family_settings",
  DELETE_FAMILY = "delete_family",

  // Content permissions
  UPLOAD_PHOTOS = "upload_photos",
  MANAGE_DOCUMENTS = "manage_documents",
  EXPORT_DATA = "export_data",

  // Communication permissions
  SEND_MESSAGES = "send_messages",
  CREATE_POSTS = "create_posts",
  MODERATE_CONTENT = "moderate_content",
}

export enum PermissionLevel {
  NONE = 0,
  BASIC = 1,
  CONTRIBUTOR = 2,
  MODERATOR = 3,
  ADMIN = 4,
}

// Default permission sets for different roles
export const DEFAULT_ROLE_PERMISSIONS = {
  MEMBER: [
    FamilyPermission.VIEW_TREE,
    FamilyPermission.VIEW_MEMBERS,
    FamilyPermission.VIEW_FAMILY_INFO,
    FamilyPermission.EDIT_OWN_PROFILE,
    FamilyPermission.SEND_MESSAGES,
    FamilyPermission.CREATE_POSTS,
  ],
  CONTRIBUTOR: [
    FamilyPermission.VIEW_TREE,
    FamilyPermission.VIEW_MEMBERS,
    FamilyPermission.VIEW_FAMILY_INFO,
    FamilyPermission.EDIT_OWN_PROFILE,
    FamilyPermission.ADD_MEMBERS,
    FamilyPermission.EDIT_MEMBERS,
    FamilyPermission.SEND_INVITATIONS,
    FamilyPermission.SEND_MESSAGES,
    FamilyPermission.CREATE_POSTS,
    FamilyPermission.UPLOAD_PHOTOS,
  ],
  MODERATOR: [
    FamilyPermission.VIEW_TREE,
    FamilyPermission.VIEW_MEMBERS,
    FamilyPermission.VIEW_FAMILY_INFO,
    FamilyPermission.EDIT_OWN_PROFILE,
    FamilyPermission.ADD_MEMBERS,
    FamilyPermission.EDIT_MEMBERS,
    FamilyPermission.REMOVE_MEMBERS,
    FamilyPermission.MANAGE_INVITATIONS,
    FamilyPermission.SEND_INVITATIONS,
    FamilyPermission.CANCEL_INVITATIONS,
    FamilyPermission.SEND_MESSAGES,
    FamilyPermission.CREATE_POSTS,
    FamilyPermission.MODERATE_CONTENT,
    FamilyPermission.UPLOAD_PHOTOS,
    FamilyPermission.MANAGE_DOCUMENTS,
    FamilyPermission.EXPORT_DATA,
  ],
  ADMIN: [
    FamilyPermission.VIEW_TREE,
    FamilyPermission.VIEW_MEMBERS,
    FamilyPermission.VIEW_FAMILY_INFO,
    FamilyPermission.EDIT_OWN_PROFILE,
    FamilyPermission.ADD_MEMBERS,
    FamilyPermission.EDIT_MEMBERS,
    FamilyPermission.REMOVE_MEMBERS,
    FamilyPermission.MANAGE_INVITATIONS,
    FamilyPermission.SEND_INVITATIONS,
    FamilyPermission.CANCEL_INVITATIONS,
    FamilyPermission.MANAGE_PERMISSIONS,
    FamilyPermission.MANAGE_FAMILY_SETTINGS,
    FamilyPermission.DELETE_FAMILY,
    FamilyPermission.SEND_MESSAGES,
    FamilyPermission.CREATE_POSTS,
    FamilyPermission.MODERATE_CONTENT,
    FamilyPermission.UPLOAD_PHOTOS,
    FamilyPermission.MANAGE_DOCUMENTS,
    FamilyPermission.EXPORT_DATA,
  ],
} as const;

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  VIEWING: [
    FamilyPermission.VIEW_TREE,
    FamilyPermission.VIEW_MEMBERS,
    FamilyPermission.VIEW_FAMILY_INFO,
  ],
  MEMBER_MANAGEMENT: [
    FamilyPermission.ADD_MEMBERS,
    FamilyPermission.EDIT_MEMBERS,
    FamilyPermission.EDIT_OWN_PROFILE,
    FamilyPermission.REMOVE_MEMBERS,
  ],
  INVITATIONS: [
    FamilyPermission.MANAGE_INVITATIONS,
    FamilyPermission.SEND_INVITATIONS,
    FamilyPermission.CANCEL_INVITATIONS,
  ],
  ADMINISTRATION: [
    FamilyPermission.MANAGE_PERMISSIONS,
    FamilyPermission.MANAGE_FAMILY_SETTINGS,
    FamilyPermission.DELETE_FAMILY,
  ],
  CONTENT: [
    FamilyPermission.UPLOAD_PHOTOS,
    FamilyPermission.MANAGE_DOCUMENTS,
    FamilyPermission.EXPORT_DATA,
  ],
  COMMUNICATION: [
    FamilyPermission.SEND_MESSAGES,
    FamilyPermission.CREATE_POSTS,
    FamilyPermission.MODERATE_CONTENT,
  ],
} as const;

// Permission display names for UI
export const PERMISSION_DISPLAY_NAMES: Record<FamilyPermission, string> = {
  [FamilyPermission.VIEW_TREE]: "View Family Tree",
  [FamilyPermission.VIEW_MEMBERS]: "View Family Members",
  [FamilyPermission.VIEW_FAMILY_INFO]: "View Family Information",
  [FamilyPermission.ADD_MEMBERS]: "Add Family Members",
  [FamilyPermission.EDIT_MEMBERS]: "Edit Family Members",
  [FamilyPermission.EDIT_OWN_PROFILE]: "Edit Own Profile",
  [FamilyPermission.REMOVE_MEMBERS]: "Remove Family Members",
  [FamilyPermission.MANAGE_INVITATIONS]: "Manage Invitations",
  [FamilyPermission.SEND_INVITATIONS]: "Send Invitations",
  [FamilyPermission.CANCEL_INVITATIONS]: "Cancel Invitations",
  [FamilyPermission.MANAGE_PERMISSIONS]: "Manage Permissions",
  [FamilyPermission.MANAGE_FAMILY_SETTINGS]: "Manage Family Settings",
  [FamilyPermission.DELETE_FAMILY]: "Delete Family",
  [FamilyPermission.UPLOAD_PHOTOS]: "Upload Photos",
  [FamilyPermission.MANAGE_DOCUMENTS]: "Manage Documents",
  [FamilyPermission.EXPORT_DATA]: "Export Family Data",
  [FamilyPermission.SEND_MESSAGES]: "Send Messages",
  [FamilyPermission.CREATE_POSTS]: "Create Posts",
  [FamilyPermission.MODERATE_CONTENT]: "Moderate Content",
};

// Permission descriptions for UI help text
export const PERMISSION_DESCRIPTIONS: Record<FamilyPermission, string> = {
  [FamilyPermission.VIEW_TREE]:
    "Can view the family tree structure and relationships",
  [FamilyPermission.VIEW_MEMBERS]:
    "Can view detailed information about family members",
  [FamilyPermission.VIEW_FAMILY_INFO]:
    "Can view general family information and settings",
  [FamilyPermission.ADD_MEMBERS]: "Can add new members to the family",
  [FamilyPermission.EDIT_MEMBERS]:
    "Can edit information of existing family members",
  [FamilyPermission.EDIT_OWN_PROFILE]: "Can edit their own profile information",
  [FamilyPermission.REMOVE_MEMBERS]: "Can remove members from the family",
  [FamilyPermission.MANAGE_INVITATIONS]: "Can manage all family invitations",
  [FamilyPermission.SEND_INVITATIONS]:
    "Can send invitations to join the family",
  [FamilyPermission.CANCEL_INVITATIONS]: "Can cancel pending invitations",
  [FamilyPermission.MANAGE_PERMISSIONS]:
    "Can manage member permissions and roles",
  [FamilyPermission.MANAGE_FAMILY_SETTINGS]:
    "Can modify family settings and configuration",
  [FamilyPermission.DELETE_FAMILY]: "Can delete the entire family (dangerous)",
  [FamilyPermission.UPLOAD_PHOTOS]: "Can upload and manage family photos",
  [FamilyPermission.MANAGE_DOCUMENTS]: "Can upload and manage family documents",
  [FamilyPermission.EXPORT_DATA]: "Can export family data and reports",
  [FamilyPermission.SEND_MESSAGES]: "Can send messages to family members",
  [FamilyPermission.CREATE_POSTS]: "Can create posts on the family feed",
  [FamilyPermission.MODERATE_CONTENT]: "Can moderate posts and content",
};
