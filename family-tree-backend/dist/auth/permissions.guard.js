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
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.get("permissions", context.getHandler());
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.memberId) {
            throw new common_1.ForbiddenException("User not authenticated");
        }
        const familyId = this.extractFamilyId(request, context);
        if (!familyId) {
            throw new common_1.ForbiddenException("Family ID not found in request");
        }
        const hasPermission = await this.checkPermissions(user.memberId, familyId, requiredPermissions);
        if (!hasPermission) {
            throw new common_1.ForbiddenException("You do not have permission to perform this action");
        }
        return true;
    }
    extractFamilyId(request, context) {
        const params = context.switchToHttp().getRequest().params;
        if (params.familyId || params.id) {
            return params.familyId || params.id;
        }
        const body = context.switchToHttp().getRequest().body;
        if (body && body.familyId) {
            return body.familyId;
        }
        const query = context.switchToHttp().getRequest().query;
        if (query && query.familyId) {
            return query.familyId;
        }
        return null;
    }
    async checkPermissions(memberId, familyId, requiredPermissions) {
        try {
            const membership = await this.prisma.familyMembership.findFirst({
                where: {
                    memberId: memberId,
                    familyId: familyId,
                },
                include: {
                    family: true,
                },
            });
            if (!membership) {
                return false;
            }
            if (membership.role === client_1.FamilyRole.ADMIN ||
                membership.role === client_1.FamilyRole.HEAD) {
                return true;
            }
            const userPermissions = await this.prisma.familyMemberPermission.findMany({
                where: {
                    familyMemberId: membership.id,
                },
                select: {
                    permission: true,
                },
            });
            const userPermissionStrings = userPermissions.map((p) => p.permission);
            return requiredPermissions.every((requiredPermission) => userPermissionStrings.includes(requiredPermission));
        }
        catch (error) {
            console.error("Error checking permissions:", error);
            return false;
        }
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map