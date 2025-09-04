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
exports.MemberController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const member_service_1 = require("./member.service");
const member_dto_1 = require("./dto/member.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let MemberController = class MemberController {
    constructor(memberService) {
        this.memberService = memberService;
    }
    async getMyProfile(user) {
        return this.memberService.getProfile(user);
    }
    async updateMyProfile(user, updateDto) {
        return this.memberService.updateProfile(user, updateDto);
    }
    async getMemberDetails(user, memberId) {
        return this.memberService.getMemberDetails(user, memberId);
    }
    async addRelationship(user, relationshipDto) {
        return this.memberService.addRelationship(user, relationshipDto);
    }
    async removeRelationship(user, relationshipDto) {
        return this.memberService.removeRelationship(user, relationshipDto);
    }
    async addBulkRelationships(user, bulkDto) {
        return this.memberService.addBulkRelationships(user, bulkDto);
    }
    async createMember(user, createDto) {
        return this.memberService.createMember(user, createDto);
    }
    async getFamilyMembers(user, familyId) {
        return this.memberService.getFamilyMembers(user, familyId);
    }
};
exports.MemberController = MemberController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my profile',
        description: 'Get current user\'s member profile with all relationships',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile retrieved successfully',
        type: member_dto_1.MemberRelationshipsResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Member profile not found',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update my profile',
        description: 'Update current user\'s member profile information',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile updated successfully',
        type: member_dto_1.MemberResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Member profile not found',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.UpdateMemberProfileDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get member details',
        description: 'Get details of a specific member (must be in same family)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member details retrieved successfully',
        type: member_dto_1.MemberRelationshipsResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Member not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied - member not in your families',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMemberDetails", null);
__decorate([
    (0, common_1.Post)('relationships'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add relationship',
        description: 'Add a parent, spouse, or child relationship with another member',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Relationship added successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid relationship or member already related',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied - cannot relate to member outside your families',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.AddRelationshipDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addRelationship", null);
__decorate([
    (0, common_1.Delete)('relationships'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove relationship',
        description: 'Remove a parent, spouse, or child relationship with another member',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Relationship removed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Relationship not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.RemoveRelationshipDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "removeRelationship", null);
__decorate([
    (0, common_1.Post)('relationships/bulk'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add multiple relationships',
        description: 'Add multiple relationships in a single operation',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Bulk relationships processed',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Some relationships failed to be created',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.BulkRelationshipDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addBulkRelationships", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new member',
        description: 'Create a new member in a family (requires family access)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Member created successfully',
        type: member_dto_1.MemberResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied - not a member of this family',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Family not found',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, member_dto_1.CreateMemberDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "createMember", null);
__decorate([
    (0, common_1.Get)('family/:familyId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get family members',
        description: 'Get all members in a specific family',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Family members retrieved successfully',
        type: [member_dto_1.MemberResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied - not a member of this family',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('familyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getFamilyMembers", null);
exports.MemberController = MemberController = __decorate([
    (0, swagger_1.ApiTags)('Members'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('members'),
    __metadata("design:paramtypes", [member_service_1.MemberService])
], MemberController);
//# sourceMappingURL=member.controller.js.map