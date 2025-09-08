import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import {
  UpdateMemberProfileDto,
  AddRelationshipDto,
  RemoveRelationshipDto,
  BulkRelationshipDto,
  CreateMemberDto,
  MemberRelationshipsResponseDto,
  MemberResponseDto,
} from "./dto/member.dto";

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async getProfile(
    user: AuthenticatedUser
  ): Promise<MemberRelationshipsResponseDto> {
    if (!user.memberId) {
      throw new NotFoundException("Member profile not found");
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
      throw new NotFoundException("Member profile not found");
    }

    // Combine spouses and spousesReverse to get all spouses
    const allSpouses = [...member.spouses, ...member.spousesReverse].filter(
      (spouse, index, arr) => arr.findIndex((s) => s.id === spouse.id) === index
    );

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
      familyMemberships:
        member.familyMemberships?.map((fm: any) => ({
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

  async updateProfile(
    user: AuthenticatedUser,
    updateDto: UpdateMemberProfileDto
  ): Promise<MemberResponseDto> {
    if (!user.memberId) {
      throw new NotFoundException("Member profile not found");
    }

    const updatedMember = await this.prisma.member.update({
      where: { id: user.memberId },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.gender && { gender: updateDto.gender as any }),
        ...(updateDto.status && { status: updateDto.status as any }),
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

  async updateProfileWithFile(
    user: AuthenticatedUser,
    updateDto: UpdateMemberProfileDto,
    file?: Express.Multer.File
  ): Promise<MemberResponseDto> {
    console.log(
      `[Profile Service] Starting profile update for user ${user.memberId}`
    );

    if (!user.memberId) {
      console.error(`[Profile Service] No memberId found for user`);
      throw new NotFoundException("Member profile not found");
    }

    // Handle file upload if provided
    let profileImageUrl: string | undefined;
    let profileImageId: string | undefined;

    if (file) {
      console.log(
        `[Profile Service] Processing file upload for user ${user.memberId}`
      );

      try {
        // Create a unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split(".").pop();
        const filename = `${uniqueSuffix}.${ext}`;

        console.log(`[Profile Service] Generated filename: ${filename}`);

        // Save file to uploads directory
        const fs = require("fs");
        const path = require("path");
        const uploadDir = path.join(process.cwd(), "uploads");

        console.log(`[Profile Service] Upload directory: ${uploadDir}`);

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadDir)) {
          console.log(`[Profile Service] Creating uploads directory`);
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        console.log(`[Profile Service] Writing file to: ${filePath}`);

        fs.writeFileSync(filePath, file.buffer);
        console.log(
          `[Profile Service] File written successfully, size: ${file.size} bytes`
        );

        // Create file record in database
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

        console.log(
          `[Profile Service] File record created with ID: ${fileRecord.id}`
        );
        profileImageUrl = fileRecord.url;
        profileImageId = fileRecord.id;
      } catch (fileError) {
        console.error(
          `[Profile Service] Error processing file upload:`,
          fileError
        );
        throw fileError;
      }
    } else {
      console.log(`[Profile Service] No file provided for upload`);
    }

    // Prepare update data
    const updateData: any = {};

    if (updateDto.name) updateData.name = updateDto.name;
    if (updateDto.gender) updateData.gender = updateDto.gender;
    if (updateDto.status) updateData.status = updateDto.status;

    // Handle personal info
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

  async getMemberDetails(
    user: AuthenticatedUser,
    memberId: string
  ): Promise<MemberRelationshipsResponseDto> {
    // Check if user has access to this member (same family)
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
      throw new NotFoundException("Member not found");
    }

    // Combine spouses and spousesReverse
    const allSpouses = [...member.spouses, ...member.spousesReverse].filter(
      (spouse, index, arr) => arr.findIndex((s) => s.id === spouse.id) === index
    );

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
      familyMemberships:
        member.familyMemberships?.map((fm: any) => ({
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

  async updateMember(
    user: AuthenticatedUser,
    memberId: string,
    updateDto: UpdateMemberProfileDto
  ): Promise<MemberResponseDto> {
    console.log(
      "🔄 [BACKEND SERVICE] ===== MEMBER UPDATE SERVICE CALLED ====="
    );
    console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
    console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
    console.log("🔄 [BACKEND SERVICE] Target Member ID:", memberId);

    // Check if user has access to this member (same family)
    console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
    await this.verifyMemberAccess(user, memberId);
    console.log("✅ [BACKEND SERVICE] Access verification passed");

    // Prepare update data
    const updateData: any = {};
    if (updateDto.name) {
      updateData.name = updateDto.name;
      console.log("📝 [BACKEND SERVICE] Will update name to:", updateDto.name);
    }
    if (updateDto.gender) {
      updateData.gender = updateDto.gender;
      console.log(
        "📝 [BACKEND SERVICE] Will update gender to:",
        updateDto.gender
      );
    }
    if (updateDto.status) {
      updateData.status = updateDto.status;
      console.log(
        "📝 [BACKEND SERVICE] Will update status to:",
        updateDto.status
      );
    }
    if (updateDto.personalInfo) {
      updateData.personalInfo = updateDto.personalInfo;
      console.log(
        "📝 [BACKEND SERVICE] Will update personal info:",
        Object.keys(updateDto.personalInfo)
      );
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
    console.log(
      "🔄 [BACKEND SERVICE] ===== MEMBER UPDATE SERVICE COMPLETED ====="
    );
    return response;
  }

  async addRelationship(
    user: AuthenticatedUser,
    relationshipDto: AddRelationshipDto
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      "🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP SERVICE CALLED ====="
    );
    console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
    console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
    console.log(
      "👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:",
      relationshipDto.relationshipType
    );
    console.log(
      "👤 [BACKEND SERVICE] Related member ID:",
      relationshipDto.relatedMemberId
    );
    console.log("🏠 [BACKEND SERVICE] Family ID:", relationshipDto.familyId);

    if (!user.memberId) {
      console.error("❌ [BACKEND SERVICE] No user member ID found");
      throw new NotFoundException("Member profile not found");
    }

    // Verify both members exist and user has access
    console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
    await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
    console.log("✅ [BACKEND SERVICE] Access verification passed");

    const currentMember = await this.prisma.member.findUnique({
      where: { id: user.memberId },
    });

    if (!currentMember) {
      console.error("❌ [BACKEND SERVICE] Current member not found");
      throw new NotFoundException("Current member not found");
    }

    const relatedMember = await this.prisma.member.findUnique({
      where: { id: relationshipDto.relatedMemberId },
    });

    if (!relatedMember) {
      console.error("❌ [BACKEND SERVICE] Related member not found");
      throw new NotFoundException("Related member not found");
    }

    // Prevent self-relationship
    if (user.memberId === relationshipDto.relatedMemberId) {
      console.error("❌ [BACKEND SERVICE] Attempted self-relationship");
      throw new BadRequestException("Cannot create relationship with yourself");
    }

    console.log("✅ [BACKEND SERVICE] Validation passed");
    console.log(
      `👨‍👩‍👧‍👦 [BACKEND SERVICE] Adding ${relationshipDto.relationshipType} relationship`
    );
    console.log(
      `👤 [BACKEND SERVICE] Current user (member A): ${user.memberId} (${currentMember.name})`
    );
    console.log(
      `👤 [BACKEND SERVICE] Related member (member B): ${relationshipDto.relatedMemberId} (${relatedMember.name})`
    );

    return this.prisma.$transaction(async (prisma) => {
      switch (relationshipDto.relationshipType) {
        case "PARENT":
          console.log(
            `[Relationship Service] Setting ${relatedMember.name} as parent of ${currentMember.name}`
          );

          // Note: A person can have multiple parents of the same gender
          // (biological, adoptive, step-parents, foster parents, legal guardians, etc.)
          // We don't automatically remove existing parent relationships

          // Add relatedMember as parent of currentMember
          await prisma.member.update({
            where: { id: user.memberId },
            data: {
              parents: {
                connect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `[Relationship Service] Setting ${currentMember.name} as child of ${relatedMember.name}`
          );
          // Add currentMember as child of relatedMember (bidirectional)
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
          console.log(
            `[Relationship Service] Setting ${relatedMember.name} as child of ${currentMember.name}`
          );

          // Note: A person can have multiple children, so we don't remove existing children relationships
          // Add relatedMember as child of currentMember
          await prisma.member.update({
            where: { id: user.memberId },
            data: {
              children: {
                connect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `[Relationship Service] Setting ${currentMember.name} as parent of ${relatedMember.name}`
          );

          // Note: A child can have multiple parents of the same gender
          // (biological, adoptive, step-parents, foster parents, legal guardians, etc.)
          // We don't automatically remove existing parent relationships

          // Add currentMember as parent of relatedMember (bidirectional)
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
          console.log(
            `[Relationship Service] Creating bidirectional spouse relationship between ${currentMember.name} and ${relatedMember.name}`
          );

          // Note: A person can have multiple spouses (polygamy, multiple marriages, etc.)
          // We don't automatically remove existing spouse relationships

          // Add bidirectional spouse relationship
          await prisma.member.update({
            where: { id: user.memberId },
            data: {
              spouses: {
                connect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          // The spousesReverse relationship will be handled by Prisma
          break;

        default:
          throw new BadRequestException("Invalid relationship type");
      }

      console.log(
        `[Relationship Service] ${relationshipDto.relationshipType} relationship created successfully`
      );
      console.log(
        "🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP SERVICE COMPLETED ====="
      );
      return {
        success: true,
        message: `${relationshipDto.relationshipType.toLowerCase()} relationship added successfully`,
      };
    });
  }

  async addRelationshipToMember(
    user: AuthenticatedUser,
    targetMemberId: string,
    relationshipDto: AddRelationshipDto
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      "🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP TO MEMBER SERVICE CALLED ====="
    );
    console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
    console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
    console.log("🔄 [BACKEND SERVICE] Target Member ID:", targetMemberId);
    console.log(
      "👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:",
      relationshipDto.relationshipType
    );
    console.log(
      "👤 [BACKEND SERVICE] Related member ID:",
      relationshipDto.relatedMemberId
    );
    console.log("🏠 [BACKEND SERVICE] Family ID:", relationshipDto.familyId);

    if (!user.memberId) {
      console.error("❌ [BACKEND SERVICE] No user member ID found");
      throw new NotFoundException("Member profile not found");
    }

    // Verify user has access to both target member and related member
    console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
    await this.verifyMemberAccess(user, targetMemberId);
    await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
    console.log("✅ [BACKEND SERVICE] Access verification passed");

    const targetMember = await this.prisma.member.findUnique({
      where: { id: targetMemberId },
    });

    if (!targetMember) {
      console.error("❌ [BACKEND SERVICE] Target member not found");
      throw new NotFoundException("Target member not found");
    }

    const relatedMember = await this.prisma.member.findUnique({
      where: { id: relationshipDto.relatedMemberId },
    });

    if (!relatedMember) {
      console.error("❌ [BACKEND SERVICE] Related member not found");
      throw new NotFoundException("Related member not found");
    }

    // Prevent self-relationship
    if (targetMemberId === relationshipDto.relatedMemberId) {
      console.error("❌ [BACKEND SERVICE] Attempted self-relationship");
      throw new BadRequestException("Cannot create relationship with yourself");
    }

    console.log("✅ [BACKEND SERVICE] Validation passed");
    console.log(
      `👨‍👩‍👧‍👦 [BACKEND SERVICE] Adding ${relationshipDto.relationshipType} relationship`
    );
    console.log(
      `👤 [BACKEND SERVICE] Target member (member A): ${targetMemberId} (${targetMember.name})`
    );
    console.log(
      `👤 [BACKEND SERVICE] Related member (member B): ${relationshipDto.relatedMemberId} (${relatedMember.name})`
    );

    return this.prisma.$transaction(async (prisma) => {
      switch (relationshipDto.relationshipType) {
        case "PARENT":
          console.log(
            `[Relationship Service] Setting ${relatedMember.name} as parent of ${targetMember.name}`
          );

          // Add relatedMember as parent of targetMember
          await prisma.member.update({
            where: { id: targetMemberId },
            data: {
              parents: {
                connect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `[Relationship Service] Setting ${targetMember.name} as child of ${relatedMember.name}`
          );
          // Add targetMember as child of relatedMember (bidirectional)
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
          console.log(
            `[Relationship Service] Setting ${relatedMember.name} as child of ${targetMember.name}`
          );

          // Add relatedMember as child of targetMember
          await prisma.member.update({
            where: { id: targetMemberId },
            data: {
              children: {
                connect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `[Relationship Service] Setting ${targetMember.name} as parent of ${relatedMember.name}`
          );

          // Add targetMember as parent of relatedMember (bidirectional)
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
          console.log(
            `[Relationship Service] Creating bidirectional spouse relationship between ${targetMember.name} and ${relatedMember.name}`
          );

          // Add bidirectional spouse relationship
          await prisma.member.update({
            where: { id: targetMemberId },
            data: {
              spouses: {
                connect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          // The spousesReverse relationship will be handled by Prisma
          break;

        default:
          throw new BadRequestException("Invalid relationship type");
      }

      console.log(
        `[Relationship Service] ${relationshipDto.relationshipType} relationship created successfully`
      );
      console.log(
        "🔄 [BACKEND SERVICE] ===== ADD RELATIONSHIP TO MEMBER SERVICE COMPLETED ====="
      );
      return {
        success: true,
        message: `${relationshipDto.relationshipType.toLowerCase()} relationship added successfully`,
      };
    });
  }

  async removeRelationship(
    user: AuthenticatedUser,
    relationshipDto: RemoveRelationshipDto
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      "🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP SERVICE CALLED ====="
    );
    console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
    console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
    console.log(
      "👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:",
      relationshipDto.relationshipType
    );
    console.log(
      "👤 [BACKEND SERVICE] Related member ID:",
      relationshipDto.relatedMemberId
    );

    if (!user.memberId) {
      console.error("❌ [BACKEND SERVICE] No user member ID found");
      throw new NotFoundException("Member profile not found");
    }

    console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
    await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
    console.log("✅ [BACKEND SERVICE] Access verification passed");

    return this.prisma.$transaction(async (prisma) => {
      console.log(
        `🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relationshipType} relationship between ${user.memberId} and ${relationshipDto.relatedMemberId}`
      );

      switch (relationshipDto.relationshipType) {
        case "PARENT":
          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as parent of ${user.memberId}`
          );
          // Remove relatedMember as parent of current user
          await prisma.member.update({
            where: { id: user.memberId },
            data: {
              parents: {
                disconnect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${user.memberId} as child of ${relationshipDto.relatedMemberId}`
          );
          // Remove current user as child of relatedMember (bidirectional)
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
          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as child of ${user.memberId}`
          );
          // Remove relatedMember as child of current user
          await prisma.member.update({
            where: { id: user.memberId },
            data: {
              children: {
                disconnect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${user.memberId} as parent of ${relationshipDto.relatedMemberId}`
          );
          // Remove current user as parent of relatedMember (bidirectional)
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
          console.log(
            `🗑️ [BACKEND SERVICE] Removing spouse relationship between ${user.memberId} and ${relationshipDto.relatedMemberId}`
          );
          // Remove bidirectional spouse relationship
          await prisma.member.update({
            where: { id: user.memberId },
            data: {
              spouses: {
                disconnect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          // Also remove reverse relationship
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
          throw new BadRequestException("Invalid relationship type");
      }

      console.log(
        `✅ [BACKEND SERVICE] ${relationshipDto.relationshipType} relationship removed successfully`
      );
      console.log(
        "🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP SERVICE COMPLETED ====="
      );
      return {
        success: true,
        message: `${relationshipDto.relationshipType.toLowerCase()} relationship removed successfully`,
      };
    });
  }

  async removeRelationshipFromMember(
    user: AuthenticatedUser,
    targetMemberId: string,
    relationshipDto: RemoveRelationshipDto
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      "🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP FROM MEMBER SERVICE CALLED ====="
    );
    console.log("🔄 [BACKEND SERVICE] Timestamp:", new Date().toISOString());
    console.log("🔄 [BACKEND SERVICE] User ID:", user.memberId);
    console.log("🔄 [BACKEND SERVICE] Target Member ID:", targetMemberId);
    console.log(
      "👨‍👩‍👧‍👦 [BACKEND SERVICE] Relationship type:",
      relationshipDto.relationshipType
    );
    console.log(
      "👤 [BACKEND SERVICE] Related member ID:",
      relationshipDto.relatedMemberId
    );

    if (!user.memberId) {
      console.error("❌ [BACKEND SERVICE] No user member ID found");
      throw new NotFoundException("Member profile not found");
    }

    // Verify user has access to both target member and related member
    console.log("🔐 [BACKEND SERVICE] Verifying member access permissions...");
    await this.verifyMemberAccess(user, targetMemberId);
    await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);
    console.log("✅ [BACKEND SERVICE] Access verification passed");

    const targetMember = await this.prisma.member.findUnique({
      where: { id: targetMemberId },
    });

    if (!targetMember) {
      console.error("❌ [BACKEND SERVICE] Target member not found");
      throw new NotFoundException("Target member not found");
    }

    const relatedMember = await this.prisma.member.findUnique({
      where: { id: relationshipDto.relatedMemberId },
    });

    if (!relatedMember) {
      console.error("❌ [BACKEND SERVICE] Related member not found");
      throw new NotFoundException("Related member not found");
    }

    console.log("✅ [BACKEND SERVICE] Validation passed");
    console.log(
      `👨‍👩‍👧‍👦 [BACKEND SERVICE] Removing ${relationshipDto.relationshipType} relationship`
    );
    console.log(
      `👤 [BACKEND SERVICE] Target member (member A): ${targetMemberId} (${targetMember.name})`
    );
    console.log(
      `👤 [BACKEND SERVICE] Related member (member B): ${relationshipDto.relatedMemberId} (${relatedMember.name})`
    );

    return this.prisma.$transaction(async (prisma) => {
      switch (relationshipDto.relationshipType) {
        case "PARENT":
          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as parent of ${targetMemberId}`
          );
          // Remove relatedMember as parent of targetMember
          await prisma.member.update({
            where: { id: targetMemberId },
            data: {
              parents: {
                disconnect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${targetMemberId} as child of ${relationshipDto.relatedMemberId}`
          );
          // Remove targetMember as child of relatedMember (bidirectional)
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
          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${relationshipDto.relatedMemberId} as child of ${targetMemberId}`
          );
          // Remove relatedMember as child of targetMember
          await prisma.member.update({
            where: { id: targetMemberId },
            data: {
              children: {
                disconnect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          console.log(
            `🗑️ [BACKEND SERVICE] Removing ${targetMemberId} as parent of ${relationshipDto.relatedMemberId}`
          );
          // Remove targetMember as parent of relatedMember (bidirectional)
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
          console.log(
            `🗑️ [BACKEND SERVICE] Removing spouse relationship between ${targetMemberId} and ${relationshipDto.relatedMemberId}`
          );
          // Remove bidirectional spouse relationship
          await prisma.member.update({
            where: { id: targetMemberId },
            data: {
              spouses: {
                disconnect: { id: relationshipDto.relatedMemberId },
              },
            },
          });

          // Also remove reverse relationship
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
          throw new BadRequestException("Invalid relationship type");
      }

      console.log(
        `✅ [BACKEND SERVICE] ${relationshipDto.relationshipType} relationship removed successfully`
      );
      console.log(
        "🔄 [BACKEND SERVICE] ===== REMOVE RELATIONSHIP FROM MEMBER SERVICE COMPLETED ====="
      );
      return {
        success: true,
        message: `${relationshipDto.relationshipType.toLowerCase()} relationship removed successfully`,
      };
    });
  }

  async addBulkRelationships(
    user: AuthenticatedUser,
    bulkDto: BulkRelationshipDto
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    const results = [];

    for (const relationship of bulkDto.relationships) {
      try {
        const result = await this.addRelationship(user, relationship);
        results.push({
          relationship,
          success: true,
          message: result.message,
        });
      } catch (error) {
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

  async createMember(
    user: AuthenticatedUser,
    createDto: CreateMemberDto
  ): Promise<MemberResponseDto> {
    // Verify user can add members to this family
    await this.verifyFamilyAccess(user, createDto.familyId);

    return this.prisma.$transaction(async (prisma) => {
      // Create the member
      const newMember = await prisma.member.create({
        data: {
          name: createDto.name,
          gender: createDto.gender as any,
          personalInfo: createDto.personalInfo,
        },
      });

      // Add to family
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

      // Add initial relationships if provided
      if (
        createDto.initialRelationships &&
        createDto.initialRelationships.length > 0
      ) {
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

  async getFamilyMembers(
    user: AuthenticatedUser,
    familyId: string
  ): Promise<MemberResponseDto[]> {
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

  private async verifyMemberAccess(
    user: AuthenticatedUser,
    memberId: string
  ): Promise<void> {
    if (!user.memberId) {
      throw new ForbiddenException("Access denied");
    }

    // Get user's families
    const userFamilies = await this.prisma.familyMembership.findMany({
      where: {
        memberId: user.memberId,
        isActive: true,
      },
      select: { familyId: true },
    });

    const userFamilyIds = userFamilies.map((fm) => fm.familyId);

    // Check if target member is in any of user's families
    const targetMemberFamilies = await this.prisma.familyMembership.findFirst({
      where: {
        memberId,
        familyId: { in: userFamilyIds },
        isActive: true,
      },
    });

    if (!targetMemberFamilies) {
      throw new ForbiddenException(
        "Access denied - member not in your families"
      );
    }
  }

  private async verifyFamilyAccess(
    user: AuthenticatedUser,
    familyId: string
  ): Promise<void> {
    if (!user.memberId) {
      throw new ForbiddenException("Access denied");
    }

    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: user.memberId,
        familyId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "Access denied - not a member of this family"
      );
    }
  }

  private mapToMemberResponse(member: any): MemberResponseDto {
    return {
      id: member.id,
      name: member.name,
      gender: member.gender,
      status: member.status,
      personalInfo: member.personalInfo,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      familyMemberships: member.familyMemberships?.map((fm: any) => ({
        familyId: fm.familyId,
        familyName: fm.family.name,
        role: fm.role,
        type: fm.type,
        isActive: fm.isActive,
      })),
    };
  }
}
