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
exports.InvitationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const invitation_service_1 = require("./invitation.service");
const invitation_dto_1 = require("./dto/invitation.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
let InvitationController = class InvitationController {
    constructor(invitationService) {
        this.invitationService = invitationService;
    }
    async createInvitation(user, createDto) {
        return this.invitationService.createInvitation(user, createDto);
    }
    async validateInvitation(code) {
        return this.invitationService.validateInvitationCode(code);
    }
    async acceptInvitation(acceptDto) {
        return this.invitationService.acceptInvitation(acceptDto);
    }
    async getFamilyInvitations(user, familyId) {
        return this.invitationService.getFamilyInvitations(user, familyId);
    }
    async getMyInvitations(user) {
        return this.invitationService.getUserInvitations(user);
    }
};
exports.InvitationController = InvitationController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Create family invitation',
        description: 'Create an invitation code for someone to join a family',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Invitation created successfully',
        type: invitation_dto_1.InvitationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied to family',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invitation_dto_1.CreateInvitationDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate invitation code',
        description: 'Check if an invitation code is valid and get family information',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Invitation validation result',
        type: invitation_dto_1.InvitationValidationDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Invitation not found',
    }),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "validateInvitation", null);
__decorate([
    (0, common_1.Post)('accept'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Accept invitation',
        description: 'Accept an invitation and create user account',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Invitation accepted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid invitation or user already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invitation_dto_1.AcceptInvitationDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Get)('family/:familyId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get family invitations',
        description: 'Get all invitations for a specific family',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Family invitations retrieved successfully',
        type: [invitation_dto_1.InvitationResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied to family',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('familyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getFamilyInvitations", null);
__decorate([
    (0, common_1.Get)('my-invitations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my sent invitations',
        description: 'Get all invitations sent by the current user',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User invitations retrieved successfully',
        type: [invitation_dto_1.InvitationResponseDto],
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getMyInvitations", null);
exports.InvitationController = InvitationController = __decorate([
    (0, swagger_1.ApiTags)('Invitations'),
    (0, common_1.Controller)('invitations'),
    __metadata("design:paramtypes", [invitation_service_1.InvitationService])
], InvitationController);
//# sourceMappingURL=invitation.controller.js.map