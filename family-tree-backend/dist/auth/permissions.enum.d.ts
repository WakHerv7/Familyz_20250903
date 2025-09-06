export declare enum FamilyPermission {
    VIEW_TREE = "view_tree",
    VIEW_MEMBERS = "view_members",
    VIEW_FAMILY_INFO = "view_family_info",
    ADD_MEMBERS = "add_members",
    EDIT_MEMBERS = "edit_members",
    EDIT_OWN_PROFILE = "edit_own_profile",
    REMOVE_MEMBERS = "remove_members",
    MANAGE_INVITATIONS = "manage_invitations",
    SEND_INVITATIONS = "send_invitations",
    CANCEL_INVITATIONS = "cancel_invitations",
    MANAGE_PERMISSIONS = "manage_permissions",
    MANAGE_FAMILY_SETTINGS = "manage_family_settings",
    DELETE_FAMILY = "delete_family",
    UPLOAD_PHOTOS = "upload_photos",
    MANAGE_DOCUMENTS = "manage_documents",
    EXPORT_DATA = "export_data",
    SEND_MESSAGES = "send_messages",
    CREATE_POSTS = "create_posts",
    MODERATE_CONTENT = "moderate_content"
}
export declare enum PermissionLevel {
    NONE = 0,
    BASIC = 1,
    CONTRIBUTOR = 2,
    MODERATOR = 3,
    ADMIN = 4
}
export declare const DEFAULT_ROLE_PERMISSIONS: {
    readonly MEMBER: readonly [FamilyPermission.VIEW_TREE, FamilyPermission.VIEW_MEMBERS, FamilyPermission.VIEW_FAMILY_INFO, FamilyPermission.EDIT_OWN_PROFILE, FamilyPermission.SEND_MESSAGES, FamilyPermission.CREATE_POSTS];
    readonly CONTRIBUTOR: readonly [FamilyPermission.VIEW_TREE, FamilyPermission.VIEW_MEMBERS, FamilyPermission.VIEW_FAMILY_INFO, FamilyPermission.EDIT_OWN_PROFILE, FamilyPermission.ADD_MEMBERS, FamilyPermission.EDIT_MEMBERS, FamilyPermission.SEND_INVITATIONS, FamilyPermission.SEND_MESSAGES, FamilyPermission.CREATE_POSTS, FamilyPermission.UPLOAD_PHOTOS];
    readonly MODERATOR: readonly [FamilyPermission.VIEW_TREE, FamilyPermission.VIEW_MEMBERS, FamilyPermission.VIEW_FAMILY_INFO, FamilyPermission.EDIT_OWN_PROFILE, FamilyPermission.ADD_MEMBERS, FamilyPermission.EDIT_MEMBERS, FamilyPermission.REMOVE_MEMBERS, FamilyPermission.MANAGE_INVITATIONS, FamilyPermission.SEND_INVITATIONS, FamilyPermission.CANCEL_INVITATIONS, FamilyPermission.SEND_MESSAGES, FamilyPermission.CREATE_POSTS, FamilyPermission.MODERATE_CONTENT, FamilyPermission.UPLOAD_PHOTOS, FamilyPermission.MANAGE_DOCUMENTS, FamilyPermission.EXPORT_DATA];
    readonly ADMIN: readonly [FamilyPermission.VIEW_TREE, FamilyPermission.VIEW_MEMBERS, FamilyPermission.VIEW_FAMILY_INFO, FamilyPermission.EDIT_OWN_PROFILE, FamilyPermission.ADD_MEMBERS, FamilyPermission.EDIT_MEMBERS, FamilyPermission.REMOVE_MEMBERS, FamilyPermission.MANAGE_INVITATIONS, FamilyPermission.SEND_INVITATIONS, FamilyPermission.CANCEL_INVITATIONS, FamilyPermission.MANAGE_PERMISSIONS, FamilyPermission.MANAGE_FAMILY_SETTINGS, FamilyPermission.DELETE_FAMILY, FamilyPermission.SEND_MESSAGES, FamilyPermission.CREATE_POSTS, FamilyPermission.MODERATE_CONTENT, FamilyPermission.UPLOAD_PHOTOS, FamilyPermission.MANAGE_DOCUMENTS, FamilyPermission.EXPORT_DATA];
};
export declare const PERMISSION_CATEGORIES: {
    readonly VIEWING: readonly [FamilyPermission.VIEW_TREE, FamilyPermission.VIEW_MEMBERS, FamilyPermission.VIEW_FAMILY_INFO];
    readonly MEMBER_MANAGEMENT: readonly [FamilyPermission.ADD_MEMBERS, FamilyPermission.EDIT_MEMBERS, FamilyPermission.EDIT_OWN_PROFILE, FamilyPermission.REMOVE_MEMBERS];
    readonly INVITATIONS: readonly [FamilyPermission.MANAGE_INVITATIONS, FamilyPermission.SEND_INVITATIONS, FamilyPermission.CANCEL_INVITATIONS];
    readonly ADMINISTRATION: readonly [FamilyPermission.MANAGE_PERMISSIONS, FamilyPermission.MANAGE_FAMILY_SETTINGS, FamilyPermission.DELETE_FAMILY];
    readonly CONTENT: readonly [FamilyPermission.UPLOAD_PHOTOS, FamilyPermission.MANAGE_DOCUMENTS, FamilyPermission.EXPORT_DATA];
    readonly COMMUNICATION: readonly [FamilyPermission.SEND_MESSAGES, FamilyPermission.CREATE_POSTS, FamilyPermission.MODERATE_CONTENT];
};
export declare const PERMISSION_DISPLAY_NAMES: Record<FamilyPermission, string>;
export declare const PERMISSION_DESCRIPTIONS: Record<FamilyPermission, string>;
