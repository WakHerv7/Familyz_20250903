"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireViewing = exports.RequireModeration = exports.RequireCommunication = exports.RequireContentManagement = exports.RequireInvitationManagement = exports.RequireMemberManagement = exports.RequireAdmin = exports.RequirePermission = exports.Permissions = void 0;
const common_1 = require("@nestjs/common");
const permissions_enum_1 = require("./permissions.enum");
const Permissions = (...permissions) => {
    return (0, common_1.SetMetadata)("permissions", permissions);
};
exports.Permissions = Permissions;
const RequirePermission = (permission) => {
    return (0, common_1.SetMetadata)("permissions", [permission]);
};
exports.RequirePermission = RequirePermission;
const RequireAdmin = () => {
    return (0, common_1.SetMetadata)("permissions", [
        permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS,
        permissions_enum_1.FamilyPermission.MANAGE_FAMILY_SETTINGS,
        permissions_enum_1.FamilyPermission.DELETE_FAMILY,
    ]);
};
exports.RequireAdmin = RequireAdmin;
const RequireMemberManagement = () => {
    return (0, common_1.SetMetadata)("permissions", [
        permissions_enum_1.FamilyPermission.ADD_MEMBERS,
        permissions_enum_1.FamilyPermission.EDIT_MEMBERS,
        permissions_enum_1.FamilyPermission.REMOVE_MEMBERS,
    ]);
};
exports.RequireMemberManagement = RequireMemberManagement;
const RequireInvitationManagement = () => {
    return (0, common_1.SetMetadata)("permissions", [
        permissions_enum_1.FamilyPermission.MANAGE_INVITATIONS,
        permissions_enum_1.FamilyPermission.SEND_INVITATIONS,
        permissions_enum_1.FamilyPermission.CANCEL_INVITATIONS,
    ]);
};
exports.RequireInvitationManagement = RequireInvitationManagement;
const RequireContentManagement = () => {
    return (0, common_1.SetMetadata)("permissions", [
        permissions_enum_1.FamilyPermission.UPLOAD_PHOTOS,
        permissions_enum_1.FamilyPermission.MANAGE_DOCUMENTS,
        permissions_enum_1.FamilyPermission.EXPORT_DATA,
    ]);
};
exports.RequireContentManagement = RequireContentManagement;
const RequireCommunication = () => {
    return (0, common_1.SetMetadata)("permissions", [
        permissions_enum_1.FamilyPermission.SEND_MESSAGES,
        permissions_enum_1.FamilyPermission.CREATE_POSTS,
    ]);
};
exports.RequireCommunication = RequireCommunication;
const RequireModeration = () => {
    return (0, common_1.SetMetadata)("permissions", [permissions_enum_1.FamilyPermission.MODERATE_CONTENT]);
};
exports.RequireModeration = RequireModeration;
const RequireViewing = () => {
    return (0, common_1.SetMetadata)("permissions", [
        permissions_enum_1.FamilyPermission.VIEW_TREE,
        permissions_enum_1.FamilyPermission.VIEW_MEMBERS,
        permissions_enum_1.FamilyPermission.VIEW_FAMILY_INFO,
    ]);
};
exports.RequireViewing = RequireViewing;
//# sourceMappingURL=permissions.decorator.js.map