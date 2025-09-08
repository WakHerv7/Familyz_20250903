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
            throw new common_1.NotFoundException("Member profile not found");
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
            throw new common_1.NotFoundException("Member profile not found");
        }
        const allSpouses = [...member.spouses, ...member.spousesReverse].filter((spouse, index, arr) => arr.findIndex((s) => s.id === spouse.id) === index);
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
            throw new common_1.NotFoundException("Member profile not found");
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
    async updateProfileWithFile(user, updateDto, file) {
        console.log(`[Profile Service] Starting profile update for user ${user.memberId}`);
        if (!user.memberId) {
            console.error(`[Profile Service] No memberId found for user`);
            throw new common_1.NotFoundException("Member profile not found");
        }
        let profileImageUrl;
        let profileImageId;
        if (file) {
            console.log(`[Profile Service] Processing file upload for user ${user.memberId}`);
            try {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                const ext = file.originalname.split(".").pop();
                const filename = `${uniqueSuffix}.${ext}`;
                console.log(`[Profile Service] Generated filename: ${filename}`);
                const fs = require("fs");
                const path = require("path");
                const uploadDir = path.join(process.cwd(), "uploads");
                console.log(`[Profile Service] Upload directory: ${uploadDir}`);
                if (!fs.existsSync(uploadDir)) {
                    console.log(`[Profile Service] Creating uploads directory`);
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filePath = path.join(uploadDir, filename);
                console.log(`[Profile Service] Writing file to: ${filePath}`);
                fs.writeFileSync(filePath, file.buffer);
                console.log(`[Profile Service] File written successfully, size: ${file.size} bytes`);
                console.log(`[Profile Service] Creating database record for file`);
                const fileRecord = await this.prisma.file.create({
                    data: {
                        filename,
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: `/uploads/${filename}`,
                        type: "IMAGE",
                        uploadedBy: user.memberId,
                    },
                });
                console.log(`[Profile Service] File record created with ID: ${fileRecord.id}`);
                profileImageUrl = fileRecord.url;
                profileImageId = fileRecord.id;
            }
            catch (fileError) {
                console.error(`[Profile Service] Error processing file upload:`, fileError);
                throw fileError;
            }
        }
        else {
            console.log(`[Profile Service] No file provided for upload`);
        }
        const updateData = {};
        if (updateDto.name)
            updateData.name = updateDto.name;
        if (updateDto.gender)
            updateData.gender = updateDto.gender;
        if (updateDto.status)
            updateData.status = updateDto.status;
        if (updateDto.personalInfo || profileImageUrl) {
            updateData.personalInfo = {
                ...(updateDto.personalInfo || {}),
                ...(profileImageUrl && {
                    profileImage: profileImageUrl,
                    profileImageId: profileImageId,
                }),
            };
        }
        const updatedMember = await this.prisma.member.update({
            where: { id: user.memberId },
            data: updateData,
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
            throw new common_1.NotFoundException("Member not found");
        }
        const allSpouses = [...member.spouses, ...member.spousesReverse].filter((spouse, index, arr) => arr.findIndex((s) => s.id === spouse.id) === index);
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
    async updateMember(user, memberId, updateDto) {
        console.log("🔄 [BACKEND SERVICE] ===== MEMBER UPDATE SERVICE CALLED =====");
        console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
        console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
        console.log("🔄 [BACKEND SERVICE] Target Member ID:", memberId);
        console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
        await this.verifyMemberAccess(user, memberId);
        console.log("✅ [BACKEND SERVICE] Access verification passed");
        const updateData = {};
        if (updateDto.name) {
            updateData.name = updateDto.name;
            console.log("📝 [BACKEND SERVICE] Will update name to:", updateDto.name);
        }
        if (updateDto.gender) {
            updateData.gender = updateDto.gender;
            console.log("📝 [BACKEND SERVICE] Will update gender to:", updateDto.gender);
        }
        if (updateDto.status) {
            updateData.status = updateDto.status;
            console.log("📝 [BACKEND SERVICE] Will update status to:", updateDto.status);
        }
        if (updateDto.personalInfo) {
            updateData.personalInfo = updateDto.personalInfo;
            console.log("📝 [BACKEND SERVICE] Will update personal info:", Object.keys(updateDto.personalInfo));
        }
        console.log("💾 [BACKEND SERVICE] Executing database update...");
        const updatedMember = await this.prisma.member.update({
            where: { id: memberId },
            data: updateData,
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
        console.log("✅ [BACKEND SERVICE] Database update successful");
        console.log("📊 [BACKEND SERVICE] Updated member details:", {
            id: updatedMember.id,
            name: updatedMember.name,
            gender: updatedMember.gender,
            status: updatedMember.status,
            updatedAt: updatedMember.updatedAt,
        });
        const response = this.mapToMemberResponse(updatedMember);
        console.log("🔄 [BACKEND SERVICE] ===== MEMBER UPDATE SERVICE COMPLETED =====");
        return response;
    }
    async addRelationship(user, relationshipDto) {
        console.log("🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP SERVICE CALLED =====");
        console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
        console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
        console.log("👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:", relationshipDto.relationshipType);
        console.log("👤 [BACKEND SERVICE] Related member ID:", relationshipDto.relatedMemberId);
        console.log("🏠 [BACKEND SERVICE] Family ID:", relationshipDto.familyId);
        if (!user.memberId) {
            console.error("❌ [BACKEND SERVICE] No user member ID found");
            throw new common_1.NotFoundException("Member profile not found");
        }
        console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
        await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
        console.log("✅ [BACKEND SERVICE] Access verification passed");
        const currentMember = await this.prisma.member.findUnique({
            where: { id: user.memberId },
        });
        if (!currentMember) {
            console.error("❌ [BACKEND SERVICE] Current member not found");
            throw new common_1.NotFoundException("Current member not found");
        }
        const relatedMember = await this.prisma.member.findUnique({
            where: { id: relationshipDto.relatedMemberId },
        });
        if (!relatedMember) {
            console.error("❌ [BACKEND SERVICE] Related member not found");
            throw new common_1.NotFoundException("Related member not found");
        }
        if (user.memberId === relationshipDto.relatedMemberId) {
            console.error("❌ [BACKEND SERVICE] Attempted self-relationship");
            throw new common_1.BadRequestException("Cannot create relationship with yourself");
        }
        console.log("✅ [BACKEND SERVICE] Validation passed");
        console.log(`👨‍👩‍👧‍👦 [BACKEND SERVICE] Adding ${relationshipDto.relationshipType} relationship`);
        console.log(`👤 [BACKEND SERVICE] Current user (member A): ${user.memberId} (${currentMember.name})`);
        console.log(`👤 [BACKEND SERVICE] Related member (member B): ${relationshipDto.relatedMemberId} (${relatedMember.name})`);
        return this.prisma.$transaction(async (prisma) => {
            switch (relationshipDto.relationshipType) {
                case "PARENT":
                    console.log(`[Relationship Service] Setting ${relatedMember.name} as parent of ${currentMember.name}`);
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            parents: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`[Relationship Service] Setting ${currentMember.name} as child of ${relatedMember.name}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            children: {
                                connect: { id: user.memberId },
                            },
                        },
                    });
                    break;
                case "CHILD":
                    console.log(`[Relationship Service] Setting ${relatedMember.name} as child of ${currentMember.name}`);
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            children: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`[Relationship Service] Setting ${currentMember.name} as parent of ${relatedMember.name}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            parents: {
                                connect: { id: user.memberId },
                            },
                        },
                    });
                    break;
                case "SPOUSE":
                    console.log(`[Relationship Service] Creating bidirectional spouse relationship between ${currentMember.name} and ${relatedMember.name}`);
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
                    throw new common_1.BadRequestException("Invalid relationship type");
            }
            console.log(`[Relationship Service] ${relationshipDto.relationshipType} relationship created successfully`);
            console.log("🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP SERVICE COMPLETED =====");
            return {
                success: true,
                message: `${relationshipDto.relationshipType.toLowerCase()} relationship added successfully`,
            };
        });
    }
    async addRelationshipToMember(user, targetMemberId, relationshipDto) {
        console.log("🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP TO MEMBER SERVICE CALLED =====");
        console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
        console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
        console.log("🔄 [BACKEND SERVICE] Target Member ID:", targetMemberId);
        console.log("👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:", relationshipDto.relationshipType);
        console.log("👤 [BACKEND SERVICE] Related member ID:", relationshipDto.relatedMemberId);
        console.log("🏠 [BACKEND SERVICE] Family ID:", relationshipDto.familyId);
        if (!user.memberId) {
            console.error("❌ [BACKEND SERVICE] No user member ID found");
            throw new common_1.NotFoundException("Member profile not found");
        }
        console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
        await this.verifyMemberAccess(user, targetMemberId);
        await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
        console.log("✅ [BACKEND SERVICE] Access verification passed");
        const targetMember = await this.prisma.member.findUnique({
            where: { id: targetMemberId },
        });
        if (!targetMember) {
            console.error("❌ [BACKEND SERVICE] Target member not found");
            throw new common_1.NotFoundException("Target member not found");
        }
        const relatedMember = await this.prisma.member.findUnique({
            where: { id: relationshipDto.relatedMemberId },
        });
        if (!relatedMember) {
            console.error("❌ [BACKEND SERVICE] Related member not found");
            throw new common_1.NotFoundException("Related member not found");
        }
        if (targetMemberId === relationshipDto.relatedMemberId) {
            console.error("❌ [BACKEND SERVICE] Attempted self-relationship");
            throw new common_1.BadRequestException("Cannot create relationship with yourself");
        }
        console.log("✅ [BACKEND SERVICE] Validation passed");
        console.log(`👨‍👩‍👧‍👦 [BACKEND SERVICE] Adding ${relationshipDto.relationshipType} relationship`);
        console.log(`👤 [BACKEND SERVICE] Target member (member A): ${targetMemberId} (${targetMember.name})`);
        console.log(`👤 [BACKEND SERVICE] Related member (member B): ${relationshipDto.relatedMemberId} (${relatedMember.name})`);
        return this.prisma.$transaction(async (prisma) => {
            switch (relationshipDto.relationshipType) {
                case "PARENT":
                    console.log(`[Relationship Service] Setting ${relatedMember.name} as parent of ${targetMember.name}`);
                    await prisma.member.update({
                        where: { id: targetMemberId },
                        data: {
                            parents: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`[Relationship Service] Setting ${targetMember.name} as child of ${relatedMember.name}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            children: {
                                connect: { id: targetMemberId },
                            },
                        },
                    });
                    break;
                case "CHILD":
                    console.log(`[Relationship Service] Setting ${relatedMember.name} as child of ${targetMember.name}`);
                    await prisma.member.update({
                        where: { id: targetMemberId },
                        data: {
                            children: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`[Relationship Service] Setting ${targetMember.name} as parent of ${relatedMember.name}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            parents: {
                                connect: { id: targetMemberId },
                            },
                        },
                    });
                    break;
                case "SPOUSE":
                    console.log(`[Relationship Service] Creating bidirectional spouse relationship between ${targetMember.name} and ${relatedMember.name}`);
                    await prisma.member.update({
                        where: { id: targetMemberId },
                        data: {
                            spouses: {
                                connect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    break;
                default:
                    throw new common_1.BadRequestException("Invalid relationship type");
            }
            console.log(`[Relationship Service] ${relationshipDto.relationshipType} relationship created successfully`);
            console.log("🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP TO MEMBER SERVICE COMPLETED =====");
            return {
                success: true,
                message: `${relationshipDto.relationshipType.toLowerCase()} relationship added successfully`,
            };
        });
    }
    async removeRelationship(user, relationshipDto) {
        console.log("🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP SERVICE CALLED =====");
        console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
        console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
        console.log("👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:", relationshipDto.relationshipType);
        console.log("👤 [BACKEND SERVICE] Related member ID:", relationshipDto.relatedMemberId);
        if (!user.memberId) {
            console.error("❌ [BACKEND SERVICE] No user member ID found");
            throw new common_1.NotFoundException("Member profile not found");
        }
        console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
        await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
        console.log("✅ [BACKEND SERVICE] Access verification passed");
        return this.prisma.$transaction(async (prisma) => {
            console.log(`🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relationshipType} relationship between ${user.memberId} and ${relationshipDto.relatedMemberId}`);
            switch (relationshipDto.relationshipType) {
                case "PARENT":
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as parent of ${user.memberId}`);
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            parents: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${user.memberId} as child of ${relationshipDto.relatedMemberId}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            children: {
                                disconnect: { id: user.memberId },
                            },
                        },
                    });
                    break;
                case "CHILD":
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as child of ${user.memberId}`);
                    await prisma.member.update({
                        where: { id: user.memberId },
                        data: {
                            children: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${user.memberId} as parent of ${relationshipDto.relatedMemberId}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            parents: {
                                disconnect: { id: user.memberId },
                            },
                        },
                    });
                    break;
                case "SPOUSE":
                    console.log(`🗑️ [BACKEND SERVICE] Removing spouse relationship between ${user.memberId} and ${relationshipDto.relatedMemberId}`);
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
                    throw new common_1.BadRequestException("Invalid relationship type");
            }
            console.log(`✅ [BACKEND SERVICE] ${relationshipDto.relationshipType} relationship removed successfully`);
            console.log("🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP SERVICE COMPLETED =====");
            return {
                success: true,
                message: `${relationshipDto.relationshipType.toLowerCase()} relationship removed successfully`,
            };
        });
    }
    async removeRelationshipFromMember(user, targetMemberId, relationshipDto) {
        console.log("🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP FROM MEMBER SERVICE CALLED =====");
        console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
        console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
        console.log("🔄 [BACKEND SERVICE] Target Member ID:", targetMemberId);
        console.log("👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:", relationshipDto.relationshipType);
        console.log("👤 [BACKEND SERVICE] Related member ID:", relationshipDto.relatedMemberId);
        if (!user.memberId) {
            console.error("❌ [BACKEND SERVICE] No user member ID found");
            throw new common_1.NotFoundException("Member profile not found");
        }
        console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
        await this.verifyMemberAccess(user, targetMemberId);
        await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
        console.log("✅ [BACKEND SERVICE] Access verification passed");
        const targetMember = await this.prisma.member.findUnique({
            where: { id: targetMemberId },
        });
        if (!targetMember) {
            console.error("❌ [BACKEND SERVICE] Target member not found");
            throw new common_1.NotFoundException("Target member not found");
        }
        const relatedMember = await this.prisma.member.findUnique({
            where: { id: relationshipDto.relatedMemberId },
        });
        if (!relatedMember) {
            console.error("❌ [BACKEND SERVICE] Related member not found");
            throw new common_1.NotFoundException("Related member not found");
        }
        console.log("✅ [BACKEND SERVICE] Validation passed");
        console.log(`👨‍👩‍👧‍👦 [BACKEND SERVICE] Removing ${relationshipDto.relationshipType} relationship`);
        console.log(`👤 [BACKEND SERVICE] Target member (member A): ${targetMemberId} (${targetMember.name})`);
        console.log(`👤 [BACKEND SERVICE] Related member (member B): ${relationshipDto.relatedMemberId} (${relatedMember.name})`);
        return this.prisma.$transaction(async (prisma) => {
            switch (relationshipDto.relationshipType) {
                case "PARENT":
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as parent of ${targetMemberId}`);
                    await prisma.member.update({
                        where: { id: targetMemberId },
                        data: {
                            parents: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${targetMemberId} as child of ${relationshipDto.relatedMemberId}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            children: {
                                disconnect: { id: targetMemberId },
                            },
                        },
                    });
                    break;
                case "CHILD":
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as child of ${targetMemberId}`);
                    await prisma.member.update({
                        where: { id: targetMemberId },
                        data: {
                            children: {
                                disconnect: { id: relationshipDto.relatedMemberId },
                            },
                        },
                    });
                    console.log(`🗑️ [BACKEND SERVICE] Removing ${targetMemberId} as parent of ${relationshipDto.relatedMemberId}`);
                    await prisma.member.update({
                        where: { id: relationshipDto.relatedMemberId },
                        data: {
                            parents: {
                                disconnect: { id: targetMemberId },
                            },
                        },
                    });
                    break;
                case "SPOUSE":
                    console.log(`🗑️ [BACKEND SERVICE] Removing spouse relationship between ${targetMemberId} and ${relationshipDto.relatedMemberId}`);
                    await prisma.member.update({
                        where: { id: targetMemberId },
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
                                disconnect: { id: targetMemberId },
                            },
                        },
                    });
                    break;
                default:
                    throw new common_1.BadRequestException("Invalid relationship type");
            }
            console.log(`✅ [BACKEND SERVICE] ${relationshipDto.relationshipType} relationship removed successfully`);
            console.log("🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP FROM MEMBER SERVICE COMPLETED =====");
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
        const successCount = results.filter((r) => r.success).length;
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
                    role: "MEMBER",
                    type: "MAIN",
                    autoEnrolled: false,
                    manuallyEdited: true,
                },
            });
            if (createDto.initialRelationships &&
                createDto.initialRelationships.length > 0) {
                for (const relationship of createDto.initialRelationships) {
                    switch (relationship.relationshipType) {
                        case "PARENT":
                            await prisma.member.update({
                                where: { id: newMember.id },
                                data: {
                                    parents: {
                                        connect: { id: relationship.relatedMemberId },
                                    },
                                },
                            });
                            break;
                        case "CHILD":
                            await prisma.member.update({
                                where: { id: newMember.id },
                                data: {
                                    children: {
                                        connect: { id: relationship.relatedMemberId },
                                    },
                                },
                            });
                            break;
                        case "SPOUSE":
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
            orderBy: { name: "asc" },
        });
        return members.map((member) => this.mapToMemberResponse(member));
    }
    async verifyMemberAccess(user, memberId) {
        if (!user.memberId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        const userFamilies = await this.prisma.familyMembership.findMany({
            where: {
                memberId: user.memberId,
                isActive: true,
            },
            select: { familyId: true },
        });
        const userFamilyIds = userFamilies.map((fm) => fm.familyId);
        const targetMemberFamilies = await this.prisma.familyMembership.findFirst({
            where: {
                memberId,
                familyId: { in: userFamilyIds },
                isActive: true,
            },
        });
        if (!targetMemberFamilies) {
            throw new common_1.ForbiddenException("Access denied - member not in your families");
        }
    }
    async verifyFamilyAccess(user, familyId) {
        if (!user.memberId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        const membership = await this.prisma.familyMembership.findFirst({
            where: {
                memberId: user.memberId,
                familyId,
                isActive: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException("Access denied - not a member of this family");
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