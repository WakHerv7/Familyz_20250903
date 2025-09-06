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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyPermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const permissions_enum_1 = require("../auth/permissions.enum");
let FamilyPermissionsService = class FamilyPermissionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMemberPermissions(familyId, memberId) {
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: memberId,
                familyId: familyId,
            },
            include: {
                member: true,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException("Member not found in this family");
        }
        const permissions = await this.prisma.familyMemberPermission.findMany({
            where: {
                familyMemberId: membership.id,
            },
            select: {
                permission: true,
                grantedBy: true,
                grantedAt: true,
            },
            orderBy: {
                grantedAt: "desc",
            },
        });
        return {
            member: {
                id: membership.member.id,
                name: membership.member.name,
                role: membership.role,
            },
            permissions: permissions.map((p) => ({
                permission: p.permission,
                displayName: permissions_enum_1.PERMISSION_DISPLAY_NAMES[p.permission],
                description: permissions_enum_1.PERMISSION_DESCRIPTIONS[p.permission],
                grantedBy: p.grantedBy,
                grantedAt: p.grantedAt,
            })),
        };
    }
    async grantPermission(familyId, memberId, permission, grantedBy) {
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: memberId,
                familyId: familyId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException("Member not found in this family");
        }
        const existingPermission = await this.prisma.familyMemberPermission.findFirst({
            where: {
                familyMemberId: membership.id,
                permission: permission,
            },
        });
        if (existingPermission) {
            throw new common_1.ForbiddenException("Member already has this permission");
        }
        const newPermission = await this.prisma.familyMemberPermission.create({
            data: {
                familyMemberId: membership.id,
                permission: permission,
                grantedBy: grantedBy,
            },
        });
        return {
            message: "Permission granted successfully",
            permission: {
                permission: newPermission.permission,
                displayName: permissions_enum_1.PERMISSION_DISPLAY_NAMES[permission],
                grantedBy: newPermission.grantedBy,
                grantedAt: newPermission.grantedAt,
            },
        };
    }
    async revokePermission(familyId, memberId, permission) {
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: memberId,
                familyId: familyId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException("Member not found in this family");
        }
        const deletedPermission = await this.prisma.familyMemberPermission.deleteMany({
            where: {
                familyMemberId: membership.id,
                permission: permission,
            },
        });
        if (deletedPermission.count === 0) {
            throw new common_1.NotFoundException("Permission not found");
        }
        return {
            message: "Permission revoked successfully",
            permission: permission,
        };
    }
    async updateMemberPermissions(familyId, memberId, permissions, updatedBy) {
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: memberId,
                familyId: familyId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException("Member not found in this family");
        }
        await this.prisma.familyMemberPermission.deleteMany({
            where: {
                familyMemberId: membership.id,
            },
        });
        const permissionData = permissions.map((permission) => ({
            familyMemberId: membership.id,
            permission: permission,
            grantedBy: updatedBy,
        }));
        const newPermissions = await this.prisma.familyMemberPermission.createMany({
            data: permissionData,
        });
        return {
            message: "Permissions updated successfully",
            grantedPermissions: permissions.length,
        };
    }
    async getFamilyPermissions(familyId) {
        const memberships = await this.prisma.familyMembership.findMany({
            where: {
                familyId: familyId,
            },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        gender: true,
                    },
                },
                familyMemberPermissions: {
                    select: {
                        permission: true,
                        grantedAt: true,
                    },
                },
            },
        });
        return memberships.map((membership) => ({
            member: {
                id: membership.member.id,
                name: membership.member.name,
                gender: membership.member.gender,
                role: membership.role,
            },
            permissions: membership.familyMemberPermissions.map((p) => ({
                permission: p.permission,
                displayName: permissions_enum_1.PERMISSION_DISPLAY_NAMES[p.permission],
                grantedAt: p.grantedAt,
            })),
            permissionCount: membership.familyMemberPermissions.length,
        }));
    }
    async resetMemberPermissions(familyId, memberId, resetBy) {
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: memberId,
                familyId: familyId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException("Member not found in this family");
        }
        const defaultPermissions = permissions_enum_1.DEFAULT_ROLE_PERMISSIONS[membership.role] || [];
        await this.prisma.familyMemberPermission.deleteMany({
            where: {
                familyMemberId: membership.id,
            },
        });
        const permissionData = defaultPermissions.map((permission) => ({
            familyMemberId: membership.id,
            permission: permission,
            grantedBy: resetBy,
        }));
        const newPermissions = await this.prisma.familyMemberPermission.createMany({
            data: permissionData,
        });
        return {
            message: "Permissions reset to role defaults",
            role: membership.role,
            grantedPermissions: defaultPermissions.length,
        };
    }
    async getAvailablePermissions() {
        const permissions = Object.values(permissions_enum_1.FamilyPermission).map((permission) => ({
            permission,
            displayName: permissions_enum_1.PERMISSION_DISPLAY_NAMES[permission],
            description: permissions_enum_1.PERMISSION_DESCRIPTIONS[permission],
        }));
        return {
            permissions,
            total: permissions.length,
        };
    }
};
exports.FamilyPermissionsService = FamilyPermissionsService;
exports.FamilyPermissionsService = FamilyPermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FamilyPermissionsService);
//# sourceMappingURL=family-permissions.service.js.map