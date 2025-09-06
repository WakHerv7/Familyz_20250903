"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_DESCRIPTIONS = exports.PERMISSION_DISPLAY_NAMES = exports.PERMISSION_CATEGORIES = exports.DEFAULT_ROLE_PERMISSIONS = exports.PermissionLevel = exports.FamilyPermission = void 0;
var FamilyPermission;
(function (FamilyPermission) {
    FamilyPermission["VIEW_TREE"] = "view_tree";
    FamilyPermission["VIEW_MEMBERS"] = "view_members";
    FamilyPermission["VIEW_FAMILY_INFO"] = "view_family_info";
    FamilyPermission["ADD_MEMBERS"] = "add_members";
    FamilyPermission["EDIT_MEMBERS"] = "edit_members";
    FamilyPermission["EDIT_OWN_PROFILE"] = "edit_own_profile";
    FamilyPermission["REMOVE_MEMBERS"] = "remove_members";
    FamilyPermission["MANAGE_INVITATIONS"] = "manage_invitations";
    FamilyPermission["SEND_INVITATIONS"] = "send_invitations";
    FamilyPermission["CANCEL_INVITATIONS"] = "cancel_invitations";
    FamilyPermission["MANAGE_PERMISSIONS"] = "manage_permissions";
    FamilyPermission["MANAGE_FAMILY_SETTINGS"] = "manage_family_settings";
    FamilyPermission["DELETE_FAMILY"] = "delete_family";
    FamilyPermission["UPLOAD_PHOTOS"] = "upload_photos";
    FamilyPermission["MANAGE_DOCUMENTS"] = "manage_documents";
    FamilyPermission["EXPORT_DATA"] = "export_data";
    FamilyPermission["SEND_MESSAGES"] = "send_messages";
    FamilyPermission["CREATE_POSTS"] = "create_posts";
    FamilyPermission["MODERATE_CONTENT"] = "moderate_content";
})(FamilyPermission || (exports.FamilyPermission = FamilyPermission = {}));
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel[PermissionLevel["NONE"] = 0] = "NONE";
    PermissionLevel[PermissionLevel["BASIC"] = 1] = "BASIC";
    PermissionLevel[PermissionLevel["CONTRIBUTOR"] = 2] = "CONTRIBUTOR";
    PermissionLevel[PermissionLevel["MODERATOR"] = 3] = "MODERATOR";
    PermissionLevel[PermissionLevel["ADMIN"] = 4] = "ADMIN";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
exports.DEFAULT_ROLE_PERMISSIONS = {
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
};
exports.PERMISSION_CATEGORIES = {
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
};
exports.PERMISSION_DISPLAY_NAMES = {
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
exports.PERMISSION_DESCRIPTIONS = {
    [FamilyPermission.VIEW_TREE]: "Can view the family tree structure and relationships",
    [FamilyPermission.VIEW_MEMBERS]: "Can view detailed information about family members",
    [FamilyPermission.VIEW_FAMILY_INFO]: "Can view general family information and settings",
    [FamilyPermission.ADD_MEMBERS]: "Can add new members to the family",
    [FamilyPermission.EDIT_MEMBERS]: "Can edit information of existing family members",
    [FamilyPermission.EDIT_OWN_PROFILE]: "Can edit their own profile information",
    [FamilyPermission.REMOVE_MEMBERS]: "Can remove members from the family",
    [FamilyPermission.MANAGE_INVITATIONS]: "Can manage all family invitations",
    [FamilyPermission.SEND_INVITATIONS]: "Can send invitations to join the family",
    [FamilyPermission.CANCEL_INVITATIONS]: "Can cancel pending invitations",
    [FamilyPermission.MANAGE_PERMISSIONS]: "Can manage member permissions and roles",
    [FamilyPermission.MANAGE_FAMILY_SETTINGS]: "Can modify family settings and configuration",
    [FamilyPermission.DELETE_FAMILY]: "Can delete the entire family (dangerous)",
    [FamilyPermission.UPLOAD_PHOTOS]: "Can upload and manage family photos",
    [FamilyPermission.MANAGE_DOCUMENTS]: "Can upload and manage family documents",
    [FamilyPermission.EXPORT_DATA]: "Can export family data and reports",
    [FamilyPermission.SEND_MESSAGES]: "Can send messages to family members",
    [FamilyPermission.CREATE_POSTS]: "Can create posts on the family feed",
    [FamilyPermission.MODERATE_CONTENT]: "Can moderate posts and content",
};
//# sourceMappingURL=permissions.enum.js.map