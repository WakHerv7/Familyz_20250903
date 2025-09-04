import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  UpdateMemberProfileDto,
  AddRelationshipDto,
  RemoveRelationshipDto,
  BulkRelationshipDto,
  CreateMemberDto,
  MemberRelationshipsResponseDto,
  MemberResponseDto
} from './dto/member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async getProfile(user: AuthenticatedUser): Promise<MemberRelationshipsResponseDto> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
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
      throw new NotFoundException('Member profile not found');
    }

    // Combine spouses and spousesReverse to get all spouses
    const allSpouses = [
      ...member.spouses,
      ...member.spousesReverse,
    ].filter((spouse, index, arr) =>
      arr.findIndex(s => s.id === spouse.id) === index
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
      familyMemberships: member.familyMemberships?.map((fm: any) => ({
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

  async updateProfile(user: AuthenticatedUser, updateDto: UpdateMemberProfileDto): Promise<MemberResponseDto> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
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

  async getMemberDetails(user: AuthenticatedUser, memberId: string): Promise<MemberRelationshipsResponseDto> {
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
      throw new NotFoundException('Member not found');
    }

    // Combine spouses and spousesReverse
    const allSpouses = [
      ...member.spouses,
      ...member.spousesReverse,
    ].filter((spouse, index, arr) =>
      arr.findIndex(s => s.id === spouse.id) === index
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
      familyMemberships: member.familyMemberships?.map((fm: any) => ({
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

  async addRelationship(user: AuthenticatedUser, relationshipDto: AddRelationshipDto): Promise<{ success: boolean; message: string }> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
    }

    // Verify both members exist and user has access
    await this.verifyMemberAccess(user, relationshipDto.relatedMemberId);

    const currentMember = await this.prisma.member.findUnique({
      where: { id: user.memberId },
    });

    if (!currentMember) {
      throw new NotFoundException('Current member not found');
    }

    const relatedMember = await this.prisma.member.findUnique({
      where: { id: relationshipDto.relatedMemberId },
    });

    if (!relatedMember) {
      throw new NotFoundException('Related member not found');
    }

    // Prevent self-relationship
    if (user.memberId === relationshipDto.relatedMemberId) {
      throw new BadRequestException('Cannot create relationship with yourself');
    }

    return this.prisma.$transaction(async (prisma) => {
      switch (relationshipDto.relationshipType) {
        case 'PARENT':
          // Add relatedMember as parent of currentMember
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
          // Add relatedMember as child of currentMember
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
          // Add bidirectional spouse relationship
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
          throw new BadRequestException('Invalid relationship type');
      }

      return {
        success: true,
        message: `${relationshipDto.relationshipType.toLowerCase()} relationship added successfully`,
      };
    });
  }

  async removeRelationship(user: AuthenticatedUser, relationshipDto: RemoveRelationshipDto): Promise<{ success: boolean; message: string }> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
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
          throw new BadRequestException('Invalid relationship type');
      }

      return {
        success: true,
        message: `${relationshipDto.relationshipType.toLowerCase()} relationship removed successfully`,
      };
    });
  }

  async addBulkRelationships(user: AuthenticatedUser, bulkDto: BulkRelationshipDto): Promise<{ success: boolean; message: string; results: any[] }> {
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

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `${successCount}/${bulkDto.relationships.length} relationships added successfully`,
      results,
    };
  }

  async createMember(user: AuthenticatedUser, createDto: CreateMemberDto): Promise<MemberResponseDto> {
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
          role: 'MEMBER',
          type: 'MAIN',
          autoEnrolled: false,
          manuallyEdited: true,
        },
      });

      // Add initial relationships if provided
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

  async getFamilyMembers(user: AuthenticatedUser, familyId: string): Promise<MemberResponseDto[]> {
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

  private async verifyMemberAccess(user: AuthenticatedUser, memberId: string): Promise<void> {
    if (!user.memberId) {
      throw new ForbiddenException('Access denied');
    }

    // Get user's families
    const userFamilies = await this.prisma.familyMembership.findMany({
      where: {
        memberId: user.memberId,
        isActive: true,
      },
      select: { familyId: true },
    });

    const userFamilyIds = userFamilies.map(fm => fm.familyId);

    // Check if target member is in any of user's families
    const targetMemberFamilies = await this.prisma.familyMembership.findFirst({
      where: {
        memberId,
        familyId: { in: userFamilyIds },
        isActive: true,
      },
    });

    if (!targetMemberFamilies) {
      throw new ForbiddenException('Access denied - member not in your families');
    }
  }

  private async verifyFamilyAccess(user: AuthenticatedUser, familyId: string): Promise<void> {
    if (!user.memberId) {
      throw new ForbiddenException('Access denied');
    }

    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: user.memberId,
        familyId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied - not a member of this family');
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
