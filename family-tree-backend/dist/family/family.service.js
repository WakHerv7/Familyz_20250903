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
exports.FamilyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FamilyService = class FamilyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createFamily(user, createDto) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        if (createDto.parentFamilyId) {
            await this.verifyFamilyAccess(user, createDto.parentFamilyId);
            createDto.isSubFamily = true;
        }
        if (createDto.headOfFamilyId) {
            await this.verifyMemberAccess(user, createDto.headOfFamilyId);
        }
        return this.prisma.$transaction(async (prisma) => {
            const family = await prisma.family.create({
                data: {
                    name: createDto.name,
                    description: createDto.description,
                    isSubFamily: createDto.isSubFamily || false,
                    creatorId: user.memberId,
                    headOfFamilyId: createDto.headOfFamilyId || user.memberId,
                    parentFamilyId: createDto.parentFamilyId,
                },
            });
            await prisma.familyMembership.create({
                data: {
                    memberId: user.memberId,
                    familyId: family.id,
                    role: 'ADMIN',
                    type: createDto.isSubFamily ? 'SUB' : 'MAIN',
                    autoEnrolled: false,
                    manuallyEdited: false,
                },
            });
            if (createDto.headOfFamilyId && createDto.headOfFamilyId !== user.memberId) {
                await prisma.familyMembership.create({
                    data: {
                        memberId: createDto.headOfFamilyId,
                        familyId: family.id,
                        role: 'HEAD',
                        type: createDto.isSubFamily ? 'SUB' : 'MAIN',
                        autoEnrolled: true,
                        manuallyEdited: false,
                    },
                });
            }
            return family;
        });
    }
    async getFamilies(user) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const memberships = await this.prisma.familyMembership.findMany({
            where: {
                memberId: user.memberId,
                isActive: true,
            },
            include: {
                family: true,
            },
        });
        return memberships.map(membership => membership.family);
    }
    async getFamilyDetails(user, familyId) {
        await this.verifyFamilyAccess(user, familyId);
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            include: {
                memberships: {
                    where: { isActive: true },
                    include: {
                        member: {
                            select: { id: true, name: true },
                        },
                    },
                },
                subFamilies: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isSubFamily: true,
                        creatorId: true,
                        headOfFamilyId: true,
                        parentFamilyId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });
        if (!family) {
            throw new common_1.NotFoundException('Family not found');
        }
        return {
            ...family,
            members: family.memberships.map(membership => ({
                id: membership.member.id,
                name: membership.member.name,
                role: membership.role,
                type: membership.type,
                isActive: membership.isActive,
                joinDate: membership.joinDate,
            })),
        };
    }
    async updateFamily(user, familyId, updateDto) {
        await this.verifyFamilyAdminAccess(user, familyId);
        if (updateDto.headOfFamilyId) {
            await this.verifyMemberAccess(user, updateDto.headOfFamilyId);
            const membership = await this.prisma.familyMembership.findFirst({
                where: {
                    memberId: updateDto.headOfFamilyId,
                    familyId,
                    isActive: true,
                },
            });
            if (!membership) {
                throw new common_1.BadRequestException('New head must be a member of this family');
            }
        }
        return this.prisma.family.update({
            where: { id: familyId },
            data: updateDto,
        });
    }
    async addMemberToFamily(user, familyId, addMemberDto) {
        await this.verifyFamilyAdminAccess(user, familyId);
        await this.verifyMemberAccess(user, addMemberDto.memberId);
        const existingMembership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: addMemberDto.memberId,
                familyId,
            },
        });
        if (existingMembership) {
            if (existingMembership.isActive) {
                throw new common_1.BadRequestException('Member is already in this family');
            }
            else {
                await this.prisma.familyMembership.update({
                    where: { id: existingMembership.id },
                    data: {
                        isActive: true,
                        role: addMemberDto.role,
                        type: addMemberDto.type || 'MAIN',
                    },
                });
                return;
            }
        }
        await this.prisma.familyMembership.create({
            data: {
                memberId: addMemberDto.memberId,
                familyId,
                role: addMemberDto.role,
                type: addMemberDto.type || 'MAIN',
                autoEnrolled: false,
                manuallyEdited: true,
            },
        });
    }
    async updateFamilyMembership(user, familyId, memberId, updateDto) {
        await this.verifyFamilyAdminAccess(user, familyId);
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId,
                familyId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Membership not found');
        }
        await this.prisma.familyMembership.update({
            where: { id: membership.id },
            data: updateDto,
        });
    }
    async removeMemberFromFamily(user, familyId, memberId) {
        await this.verifyFamilyAdminAccess(user, familyId);
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            select: { creatorId: true },
        });
        if (family?.creatorId === memberId) {
            throw new common_1.BadRequestException('Cannot remove family creator');
        }
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId,
                familyId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Membership not found');
        }
        await this.prisma.familyMembership.update({
            where: { id: membership.id },
            data: { isActive: false },
        });
    }
    async deleteFamily(user, familyId) {
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            select: { creatorId: true },
        });
        if (!family) {
            throw new common_1.NotFoundException('Family not found');
        }
        if (family.creatorId !== user.memberId) {
            throw new common_1.ForbiddenException('Only family creator can delete the family');
        }
        const subFamilies = await this.prisma.family.findMany({
            where: { parentFamilyId: familyId },
            select: { id: true },
        });
        if (subFamilies.length > 0) {
            throw new common_1.BadRequestException('Cannot delete family with sub-families. Delete sub-families first.');
        }
        await this.prisma.family.delete({
            where: { id: familyId },
        });
    }
    async recalculateSubFamilyMemberships(familyId) {
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            include: {
                headOfFamily: {
                    include: {
                        children: true,
                        spouses: true,
                    },
                },
            },
        });
        if (!family || !family.isSubFamily || !family.headOfFamily) {
            throw new common_1.BadRequestException('Invalid sub-family for membership calculation');
        }
        const head = family.headOfFamily;
        const autoMembers = new Set();
        autoMembers.add(head.id);
        head.spouses.forEach(spouse => autoMembers.add(spouse.id));
        const addDescendants = async (memberId) => {
            const member = await this.prisma.member.findUnique({
                where: { id: memberId },
                include: {
                    children: true,
                    spouses: true,
                },
            });
            if (member) {
                member.children.forEach(child => {
                    autoMembers.add(child.id);
                    addDescendants(child.id);
                });
                member.children.forEach(async (child) => {
                    const childWithSpouses = await this.prisma.member.findUnique({
                        where: { id: child.id },
                        include: { spouses: true },
                    });
                    childWithSpouses?.spouses.forEach(spouse => autoMembers.add(spouse.id));
                });
            }
        };
        await addDescendants(head.id);
        for (const memberId of autoMembers) {
            const existingMembership = await this.prisma.familyMembership.findFirst({
                where: {
                    memberId,
                    familyId,
                },
            });
            if (existingMembership) {
                if (!existingMembership.manuallyEdited) {
                    await this.prisma.familyMembership.update({
                        where: { id: existingMembership.id },
                        data: {
                            isActive: true,
                            autoEnrolled: true,
                        },
                    });
                }
            }
            else {
                await this.prisma.familyMembership.create({
                    data: {
                        memberId,
                        familyId,
                        role: memberId === head.id ? 'HEAD' : 'MEMBER',
                        type: 'SUB',
                        autoEnrolled: true,
                        manuallyEdited: false,
                    },
                });
            }
        }
    }
    async verifyFamilyAccess(user, familyId) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: user.memberId,
                familyId,
                isActive: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Access denied to this family');
        }
    }
    async verifyFamilyAdminAccess(user, familyId) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: user.memberId,
                familyId,
                isActive: true,
                role: { in: ['ADMIN', 'HEAD'] },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Admin access required for this family');
        }
    }
    async verifyMemberAccess(user, memberId) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const userFamilies = await this.prisma.familyMembership.findMany({
            where: {
                memberId: user.memberId,
                isActive: true,
            },
            select: { familyId: true },
        });
        const userFamilyIds = userFamilies.map(f => f.familyId);
        const targetMemberFamilies = await this.prisma.familyMembership.findMany({
            where: {
                memberId,
                isActive: true,
                familyId: { in: userFamilyIds },
            },
        });
        if (targetMemberFamilies.length === 0) {
            throw new common_1.ForbiddenException('Access denied to this member');
        }
    }
};
exports.FamilyService = FamilyService;
exports.FamilyService = FamilyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FamilyService);
//# sourceMappingURL=family.service.js.map