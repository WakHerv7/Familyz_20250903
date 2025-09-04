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
exports.MemberService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MemberService = class MemberService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(user) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const member = await this.prisma.member.findUnique({
            where: { id: user.memberId },
            include: {
                parents: {
                    select: { id: true, name: true, gender: true },
                },
                spouses: {
                    select: { id: true, name: true, gender: true },
                },
                spousesReverse: {
                    select: { id: true, name: true, gender: true },
                },
                children: {
                    select: { id: true, name: true, gender: true },
                },
                familyMemberships: {
                    include: {
                        family: {
                            select: { name: true },
                        },
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const allSpouses = [
            ...member.spouses,
            ...member.spousesReverse,
        ].filter((spouse, index, arr) => arr.findIndex(s => s.id === spouse.id) === index);
        return {
            id: member.id,
            name: member.name,
            gender: member.gender,
            status: member.status,
            personalInfo: member.personalInfo,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
            parents: member.parents,
            spouses: allSpouses,
            children: member.children,
            familyMemberships: member.familyMemberships?.map((fm) => ({
                id: fm.id,
                familyId: fm.familyId,
                familyName: fm.family.name,
                role: fm.role,
                type: fm.type,
                autoEnrolled: fm.autoEnrolled,
                manuallyEdited: fm.manuallyEdited,
                isActive: fm.isActive,
                joinDate: fm.joinDate,
            })) || [],
        };
    }
    async updateProfile(user, updateDto) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const updatedMember = await this.prisma.member.update({
            where: { id: user.memberId },
            data: {
                ...(updateDto.name && { name: updateDto.name }),
                ...(updateDto.gender && { gender: updateDto.gender }),
                ...(updateDto.status && { status: updateDto.status }),
                ...(updateDto.personalInfo && { personalInfo: updateDto.personalInfo }),
            },
            include: {
                familyMemberships: {
                    include: {
                        family: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });
        return this.mapToMemberResponse(updatedMember);
    }
    async getMemberDetails(user, memberId) {
        await this.verifyMemberAccess(user, memberId);
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            include: {
                parents: {
                    select: { id: true, name: true, gender: true },
                },
                spouses: {
                    select: { id: true, name: true, gender: true },
                },
                spousesReverse: {
                    select: { id: true, name: true, gender: true },
                },
                children: {
                    select: { id: true, name: true, gender: true },
                },
                familyMemberships: {
                    include: {
                        family: {
                            select: { name: true },
                        },
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        const allSpouses = [
            ...member.spouses,
            ...member.spousesReverse,
        ].filter((spouse, index, arr) => arr.findIndex(s => s.id === spouse.id) === index);
        return {
            id: member.id,
            name: member.name,
            gender: member.gender,
            status: member.status,
            personalInfo: member.personalInfo,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
            parents: member.parents,
            spouses: allSpouses,
            children: member.children,
            familyMemberships: member.familyMemberships?.map((fm) => ({
                id: fm.id,
                familyId: fm.familyId,
                familyName: fm.family.name,
                role: fm.role,
                type: fm.type,
                autoEnrolled: fm.autoEnrolled,
                manuallyEdited: fm.manuallyEdited,
                isActive: fm.isActive,
                joinDate: fm.joinDate,
            })) || [],
        };
    }
    async addRelationship(user, relationshipDto) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
        const currentMember = await this.prisma.member.findUnique({
            where: { id: user.memberId },
        });
        if (!currentMember) {
            throw new common_1.NotFoundException('Current member not found');
        }
        const relatedMember = await this.prisma.member.findUnique({
            where: { id: relationshipDto.relatedMemberId },
        });
        if (!relatedMember) {
            throw new common_1.NotFoundException('Related member not found');
        }
        if (user.memberId === relationshipDto.relatedMemberId) {
            throw new common_1.BadRequestException('Cannot create relationship with yourself');
        }
        return this.prisma.$transaction(async (prisma) => {
            switch (relationshipDto.relationshipType) {
                case 'PARENT':
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            parents: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    break;
                case 'CHILD':
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            children: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    break;
                case 'SPOUSE':
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            spouses: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    break;
                default:
                    throw new common_1.BadRequestException('Invalid relationship type');
            }
            return {
                success: true,
                message: `${relationshipDto.relationshipType.toLowerCase()} relationship added successfully`,
            };
        });
    }
    async removeRelationship(user, relationshipDto) {
        if (!user.memberId) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
        return this.prisma.$transaction(async (prisma) => {
            switch (relationshipDto.relationshipType) {
                case 'PARENT':
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            parents: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    break;
                case 'CHILD':
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            children: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    break;
                case 'SPOUSE':
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            spouses: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            spouses: {
                                disconnect: { id: user.memberId },
                            },
                        },
                    });
                    break;
                default:
                    throw new common_1.BadRequestException('Invalid relationship type');
            }
            return {
                success: true,
                message: `${relationshipDto.relationshipType.toLowerCase()} relationship removed successfully`,
            };
        });
    }
    async addBulkRelationships(user, bulkDto) {
        const results = [];
        for (const relationship of bulkDto.relationships) {
            try {
                const result = await this.addRelationship(user, relationship);
                results.push({
                    relationship,
                    success: true,
                    message: result.message,
                });
            }
            catch (error) {
                results.push({
                    relationship,
                    success: false,
                    message: error.message,
                });
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount > 0,
            message: `${successCount}/${bulkDto.relationships.length} relationships added successfully`,
            results,
        };
    }
    async createMember(user, createDto) {
        await this.verifyFamilyAccess(user, createDto.familyId);
        return this.prisma.$transaction(async (prisma) => {
            const newMember = await prisma.member.create({
                data: {
                    name: createDto.name,
                    gender: createDto.gender,
                    personalInfo: createDto.personalInfo,
                },
            });
            await prisma.familyMembership.create({
                data: {
                    memberId: newMember.id,
                    familyId: createDto.familyId,
                    role: 'MEMBER',
                    type: 'MAIN',
                    autoEnrolled: false,
                    manuallyEdited: true,
                },
            });
            if (createDto.initialRelationships && createDto.initialRelationships.length > 0) {
                for (const relationship of createDto.initialRelationships) {
                    switch (relationship.relationshipType) {
                        case 'PARENT':
                            await prisma.member.update({
                                where: { id: newMember.id },
                                data: {
                                    parents: {
                                        connect: { id: relationship.relatedMemberId },
                                    },
                                },
                            });
                            break;
                        case 'CHILD':
                            await prisma.member.update({
                                where: { id: newMember.id },
                                data: {
                                    children: {
                                        connect: { id: relationship.relatedMemberId },
                                    },
                                },
                            });
                            break;
                        case 'SPOUSE':
                            await prisma.member.update({
                                where: { id: newMember.id },
                                data: {
                                    spouses: {
                                        connect: { id: relationship.relatedMemberId },
                                    },
                                },
                            });
                            break;
                    }
                }
            }
            const memberWithMemberships = await prisma.member.findUnique({
                where: { id: newMember.id },
                include: {
                    familyMemberships: {
                        include: {
                            family: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
            });
            return this.mapToMemberResponse(memberWithMemberships);
        });
    }
    async getFamilyMembers(user, familyId) {
        await this.verifyFamilyAccess(user, familyId);
        const members = await this.prisma.member.findMany({
            where: {
                familyMemberships: {
                    some: {
                        familyId,
                        isActive: true,
                    },
                },
            },
            include: {
                familyMemberships: {
                    where: { familyId },
                    include: {
                        family: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return members.map(member => this.mapToMemberResponse(member));
    }
    async verifyMemberAccess(user, memberId) {
        if (!user.memberId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const userFamilies = await this.prisma.familyMembership.findMany({
            where: {
                memberId: user.memberId,
                isActive: true,
            },
            select: { familyId: true },
        });
        const userFamilyIds = userFamilies.map(fm => fm.familyId);
        const targetMemberFamilies = await this.prisma.familyMembership.findFirst({
            where: {
                memberId,
                familyId: { in: userFamilyIds },
                isActive: true,
            },
        });
        if (!targetMemberFamilies) {
            throw new common_1.ForbiddenException('Access denied - member not in your families');
        }
    }
    async verifyFamilyAccess(user, familyId) {
        if (!user.memberId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: user.memberId,
                familyId,
                isActive: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Access denied - not a member of this family');
        }
    }
    mapToMemberResponse(member) {
        return {
            id: member.id,
            name: member.name,
            gender: member.gender,
            status: member.status,
            personalInfo: member.personalInfo,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
            familyMemberships: member.familyMemberships?.map((fm) => ({
                familyId: fm.familyId,
                familyName: fm.family.name,
                role: fm.role,
                type: fm.type,
                isActive: fm.isActive,
            })),
        };
    }
};
exports.MemberService = MemberService;
exports.MemberService = MemberService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MemberService);
//# sourceMappingURL=member.service.js.map