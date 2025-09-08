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
exports.FamilyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const family_service_1 = require("./family.service");
const family_dto_1 = require("./dto/family.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let FamilyController = class FamilyController {
    constructor(familyService) {
        this.familyService = familyService;
    }
    async createFamily(user, createDto) {
        return this.familyService.createFamily(user, createDto);
    }
    async getMyFamilies(user) {
        return this.familyService.getFamilies(user);
    }
    async getFamilyDetails(user, familyId) {
        return this.familyService.getFamilyDetails(user, familyId);
    }
    async updateFamily(user, familyId, updateDto) {
        return this.familyService.updateFamily(user, familyId, updateDto);
    }
    async addMemberToFamily(user, familyId, addMemberDto) {
        await this.familyService.addMemberToFamily(user, familyId, addMemberDto);
        return { success: true, message: "Member added to family successfully" };
    }
    async updateFamilyMembership(user, familyId, memberId, updateDto) {
        await this.familyService.updateFamilyMembership(user, familyId, memberId, updateDto);
        return { success: true, message: "Membership updated successfully" };
    }
    async removeMemberFromFamily(user, familyId, memberId) {
        await this.familyService.removeMemberFromFamily(user, familyId, memberId);
        return {
            success: true,
            message: "Member removed from family successfully",
        };
    }
    async recalculateSubFamilyMemberships(user, familyId) {
        await this.familyService.recalculateSubFamilyMemberships(familyId);
        return {
            success: true,
            message: "Sub-family memberships recalculated successfully",
        };
    }
    async softDeleteFamily(user, familyId) {
        await this.familyService.softDeleteFamily(user, familyId);
        return { success: true, message: "Family deleted successfully" };
    }
    async restoreFamily(user, familyId) {
        await this.familyService.restoreFamily(user, familyId);
        return { success: true, message: "Family restored successfully" };
    }
    async deleteFamily(user, familyId) {
        await this.familyService.deleteFamily(user, familyId);
        return {
            success: true,
            message: "Family permanently deleted successfully",
        };
    }
};
exports.FamilyController = FamilyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: "Create new family",
        description: "Create a new family or sub-family",
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "Family created successfully",
        type: family_dto_1.FamilyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Access denied",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, family_dto_1.CreateFamilyDto]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "createFamily", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: "Get my families",
        description: "Get all families the current user is a member of",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Families retrieved successfully",
        type: [family_dto_1.FamilyResponseDto],
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "getMyFamilies", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({
        summary: "Get family details",
        description: "Get detailed information about a specific family including members",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Family details retrieved successfully",
        type: family_dto_1.FamilyWithMembersDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Access denied to this family",
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: "Family not found",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "getFamilyDetails", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, swagger_1.ApiOperation)({
        summary: "Update family",
        description: "Update family information (requires admin access)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Family updated successfully",
        type: family_dto_1.FamilyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Admin access required",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, family_dto_1.UpdateFamilyDto]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "updateFamily", null);
__decorate([
    (0, common_1.Post)(":id/members"),
    (0, swagger_1.ApiOperation)({
        summary: "Add member to family",
        description: "Add a member to the family (requires admin access)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "Member added successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Admin access required",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, family_dto_1.AddMemberToFamilyDto]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "addMemberToFamily", null);
__decorate([
    (0, common_1.Patch)(":id/members/:memberId"),
    (0, swagger_1.ApiOperation)({
        summary: "Update family membership",
        description: "Update a member's role and status in the family (requires admin access)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Membership updated successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Admin access required",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("memberId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, family_dto_1.UpdateFamilyMembershipDto]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "updateFamilyMembership", null);
__decorate([
    (0, common_1.Delete)(":id/members/:memberId"),
    (0, swagger_1.ApiOperation)({
        summary: "Remove member from family",
        description: "Remove a member from the family (requires admin access)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Member removed successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Admin access required",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("memberId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "removeMemberFromFamily", null);
__decorate([
    (0, common_1.Post)(":id/subfamily/recalculate"),
    (0, swagger_1.ApiOperation)({
        summary: "Recalculate sub-family memberships",
        description: "Automatically recalculate sub-family memberships based on relationships",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Sub-family memberships recalculated successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Admin access required",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "recalculateSubFamilyMemberships", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({
        summary: "Soft delete family",
        description: "Soft delete a family (only creator can delete)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Family soft deleted successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Only creator can delete family",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "softDeleteFamily", null);
__decorate([
    (0, common_1.Post)(":id/restore"),
    (0, swagger_1.ApiOperation)({
        summary: "Restore family",
        description: "Restore a soft deleted family (only creator can restore)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Family restored successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Only creator can restore family",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "restoreFamily", null);
__decorate([
    (0, common_1.Delete)(":id/hard"),
    (0, swagger_1.ApiOperation)({
        summary: "Hard delete family",
        description: "Permanently delete a family (only creator can delete)",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Family hard deleted successfully",
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Only creator can delete family",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "deleteFamily", null);
exports.FamilyController = FamilyController = __decorate([
    (0, swagger_1.ApiTags)("Families"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("families"),
    __metadata("design:paramtypes", [family_service_1.FamilyService])
], FamilyController);
//# sourceMappingURL=family.controller.js.map