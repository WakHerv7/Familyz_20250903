"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyPermissionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_enum_1 = require("../auth/permissions.enum");
const family_permissions_service_1 = require("./family-permissions.service");
let FamilyPermissionsController = class FamilyPermissionsController {
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async getMemberPermissions(familyId, memberId) {
        return await this.permissionsService.getMemberPermissions(familyId, memberId);
    }
    async grantPermission(familyId, memberId, body, req) {
        return await this.permissionsService.grantPermission(familyId, memberId, body.permission, req.user.memberId);
    }
    async revokePermission(familyId, memberId, permission) {
        return await this.permissionsService.revokePermission(familyId, memberId, permission);
    }
    async updateMemberPermissions(familyId, memberId, body, req) {
        return await this.permissionsService.updateMemberPermissions(familyId, memberId, body.permissions, req.user.memberId);
    }
    async getFamilyPermissions(familyId) {
        return await this.permissionsService.getFamilyPermissions(familyId);
    }
    async resetMemberPermissions(familyId, memberId, req) {
        return await this.permissionsService.resetMemberPermissions(familyId, memberId, req.user.memberId);
    }
    async getAvailablePermissions() {
        return await this.permissionsService.getAvailablePermissions();
    }
};
exports.FamilyPermissionsController = FamilyPermissionsController;
__decorate([
    (0, common_1.Get)(":familyId/members/:memberId/permissions"),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS),
    __param(0, (0, common_1.Param)("familyId")),
    __param(1, (0, common_1.Param)("memberId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "getMemberPermissions", null);
__decorate([
    (0, common_1.Post)(":familyId/members/:memberId/permissions"),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS),
    __param(0, (0, common_1.Param)("familyId")),
    __param(1, (0, common_1.Param)("memberId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "grantPermission", null);
__decorate([
    (0, common_1.Delete)(":familyId/members/:memberId/permissions/:permission"),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS),
    __param(0, (0, common_1.Param)("familyId")),
    __param(1, (0, common_1.Param)("memberId")),
    __param(2, (0, common_1.Param)("permission")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "revokePermission", null);
__decorate([
    (0, common_1.Put)(":familyId/members/:memberId/permissions"),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS),
    __param(0, (0, common_1.Param)("familyId")),
    __param(1, (0, common_1.Param)("memberId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "updateMemberPermissions", null);
__decorate([
    (0, common_1.Get)(":familyId/permissions"),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS),
    __param(0, (0, common_1.Param)("familyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "getFamilyPermissions", null);
__decorate([
    (0, common_1.Post)(":familyId/members/:memberId/permissions/reset"),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_PERMISSIONS),
    __param(0, (0, common_1.Param)("familyId")),
    __param(1, (0, common_1.Param)("memberId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "resetMemberPermissions", null);
__decorate([
    (0, common_1.Get)("permissions/available"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FamilyPermissionsController.prototype, "getAvailablePermissions", null);
exports.FamilyPermissionsController = FamilyPermissionsController = __decorate([
    (0, common_1.Controller)("families"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [family_permissions_service_1.FamilyPermissionsService])
], FamilyPermissionsController);
//# sourceMappingURL=family-permissions.controller.js.map