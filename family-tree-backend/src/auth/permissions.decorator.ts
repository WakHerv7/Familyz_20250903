import { SetMetadata } from "@nestjs/common";
import { FamilyPermission } from "./permissions.enum";

/**
 * Decorator to set required permissions for a route handler
 * @param permissions Array of required permissions
 */
export const Permissions = (...permissions: FamilyPermission[]) => {
  return SetMetadata("permissions", permissions);
};

/**
 * Decorator to require specific permission for a route handler
 * @param permission Single required permission
 */
export const RequirePermission = (permission: FamilyPermission) => {
  return SetMetadata("permissions", [permission]);
};

/**
 * Decorator to require admin-level permissions
 */
export const RequireAdmin = () => {
  return SetMetadata("permissions", [
    FamilyPermission.MANAGE_PERMISSIONS,
    FamilyPermission.MANAGE_FAMILY_SETTINGS,
    FamilyPermission.DELETE_FAMILY,
  ]);
};

/**
 * Decorator to require member management permissions
 */
export const RequireMemberManagement = () => {
  return SetMetadata("permissions", [
    FamilyPermission.ADD_MEMBERS,
    FamilyPermission.EDIT_MEMBERS,
    FamilyPermission.REMOVE_MEMBERS,
  ]);
};

/**
 * Decorator to require invitation management permissions
 */
export const RequireInvitationManagement = () => {
  return SetMetadata("permissions", [
    FamilyPermission.MANAGE_INVITATIONS,
    FamilyPermission.SEND_INVITATIONS,
    FamilyPermission.CANCEL_INVITATIONS,
  ]);
};

/**
 * Decorator to require content management permissions
 */
export const RequireContentManagement = () => {
  return SetMetadata("permissions", [
    FamilyPermission.UPLOAD_PHOTOS,
    FamilyPermission.MANAGE_DOCUMENTS,
    FamilyPermission.EXPORT_DATA,
  ]);
};

/**
 * Decorator to require communication permissions
 */
export const RequireCommunication = () => {
  return SetMetadata("permissions", [
    FamilyPermission.SEND_MESSAGES,
    FamilyPermission.CREATE_POSTS,
  ]);
};

/**
 * Decorator to require moderation permissions
 */
export const RequireModeration = () => {
  return SetMetadata("permissions", [FamilyPermission.MODERATE_CONTENT]);
};

/**
 * Decorator for basic viewing permissions
 */
export const RequireViewing = () => {
  return SetMetadata("permissions", [
    FamilyPermission.VIEW_TREE,
    FamilyPermission.VIEW_MEMBERS,
    FamilyPermission.VIEW_FAMILY_INFO,
  ]);
};
