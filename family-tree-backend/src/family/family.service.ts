import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  CreateFamilyDto,
  UpdateFamilyDto,
  UpdateFamilyMembershipDto,
  AddMemberToFamilyDto,
  FamilyResponseDto,
  FamilyWithMembersDto
} from './dto/family.dto';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  async createFamily(user: AuthenticatedUser, createDto: CreateFamilyDto): Promise<FamilyResponseDto> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
    }

    // If creating a sub-family, verify parent family access
    if (createDto.parentFamilyId) {
      await this.verifyFamilyAccess(user, createDto.parentFamilyId);
      createDto.isSubFamily = true;
    }

    // If headOfFamilyId is specified, verify access to that member
    if (createDto.headOfFamilyId) {
      await this.verifyMemberAccess(user, createDto.headOfFamilyId);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Create the family
      const family = await prisma.family.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          isSubFamily: createDto.isSubFamily || false,
          creatorId: user.memberId!,
          headOfFamilyId: createDto.headOfFamilyId || user.memberId!,
          parentFamilyId: createDto.parentFamilyId,
        },
      });

      // Add creator as admin member
      await prisma.familyMembership.create({
        data: {
          memberId: user.memberId!,
          familyId: family.id,
          role: 'ADMIN',
          type: createDto.isSubFamily ? 'SUB' : 'MAIN',
          autoEnrolled: false,
          manuallyEdited: false,
        },
      });

      // If there's a different head of family, add them too
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

  async getFamilies(user: AuthenticatedUser): Promise<FamilyResponseDto[]> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
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

  async getFamilyDetails(user: AuthenticatedUser, familyId: string): Promise<FamilyWithMembersDto> {
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
      throw new NotFoundException('Family not found');
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

  async updateFamily(user: AuthenticatedUser, familyId: string, updateDto: UpdateFamilyDto): Promise<FamilyResponseDto> {
    await this.verifyFamilyAdminAccess(user, familyId);

    // If updating head of family, verify access to the new head
    if (updateDto.headOfFamilyId) {
      await this.verifyMemberAccess(user, updateDto.headOfFamilyId);

      // Verify the new head is a member of this family
      const membership = await this.prisma.familyMembership.findFirst({
        where: {
          memberId: updateDto.headOfFamilyId,
          familyId,
          isActive: true,
        },
      });

      if (!membership) {
        throw new BadRequestException('New head must be a member of this family');
      }
    }

    return this.prisma.family.update({
      where: { id: familyId },
      data: updateDto,
    });
  }

  async addMemberToFamily(user: AuthenticatedUser, familyId: string, addMemberDto: AddMemberToFamilyDto): Promise<void> {
    await this.verifyFamilyAdminAccess(user, familyId);

    // Verify access to the member being added
    await this.verifyMemberAccess(user, addMemberDto.memberId);

    // Check if member is already in this family
    const existingMembership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: addMemberDto.memberId,
        familyId,
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new BadRequestException('Member is already in this family');
      } else {
        // Reactivate membership
        await this.prisma.familyMembership.update({
          where: { id: existingMembership.id },
          data: {
            isActive: true,
            role: addMemberDto.role,
            type: (addMemberDto.type as any) || 'MAIN',
          },
        });
        return;
      }
    }

    // Create new membership
    await this.prisma.familyMembership.create({
      data: {
        memberId: addMemberDto.memberId,
        familyId,
        role: addMemberDto.role,
        type: (addMemberDto.type as any) || 'MAIN',
        autoEnrolled: false,
        manuallyEdited: true,
      },
    });
  }

  async updateFamilyMembership(
    user: AuthenticatedUser,
    familyId: string,
    memberId: string,
    updateDto: UpdateFamilyMembershipDto
  ): Promise<void> {
    await this.verifyFamilyAdminAccess(user, familyId);

    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId,
        familyId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    await this.prisma.familyMembership.update({
      where: { id: membership.id },
      data: updateDto,
    });
  }

  async removeMemberFromFamily(user: AuthenticatedUser, familyId: string, memberId: string): Promise<void> {
    await this.verifyFamilyAdminAccess(user, familyId);

    // Don't allow removing the creator
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { creatorId: true },
    });

    if (family?.creatorId === memberId) {
      throw new BadRequestException('Cannot remove family creator');
    }

    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId,
        familyId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    await this.prisma.familyMembership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }

  async deleteFamily(user: AuthenticatedUser, familyId: string): Promise<void> {
    // Only creator can delete family
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { creatorId: true },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (family.creatorId !== user.memberId) {
      throw new ForbiddenException('Only family creator can delete the family');
    }

    // Check for sub-families
    const subFamilies = await this.prisma.family.findMany({
      where: { parentFamilyId: familyId },
      select: { id: true },
    });

    if (subFamilies.length > 0) {
      throw new BadRequestException('Cannot delete family with sub-families. Delete sub-families first.');
    }

    await this.prisma.family.delete({
      where: { id: familyId },
    });
  }

  // Automated sub-family membership calculation
  async recalculateSubFamilyMemberships(familyId: string): Promise<void> {
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
      throw new BadRequestException('Invalid sub-family for membership calculation');
    }

    const head = family.headOfFamily;
    const autoMembers = new Set<string>();

    // Add head of family
    autoMembers.add(head.id);

    // Add all spouses of head
    head.spouses.forEach(spouse => autoMembers.add(spouse.id));

    // Add all descendants (children and their descendants recursively)
    const addDescendants = async (memberId: string) => {
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
          // Recursively add descendants
          addDescendants(child.id);
        });

        // Add spouses of children
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

    // Update memberships
    for (const memberId of autoMembers) {
      const existingMembership = await this.prisma.familyMembership.findFirst({
        where: {
          memberId,
          familyId,
        },
      });

      if (existingMembership) {
        // Update existing membership if not manually edited
        if (!existingMembership.manuallyEdited) {
          await this.prisma.familyMembership.update({
            where: { id: existingMembership.id },
            data: {
              isActive: true,
              autoEnrolled: true,
            },
          });
        }
      } else {
        // Create new auto-enrollment
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

  // Helper methods
  private async verifyFamilyAccess(user: AuthenticatedUser, familyId: string): Promise<void> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
    }

    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: user.memberId,
        familyId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to this family');
    }
  }

  private async verifyFamilyAdminAccess(user: AuthenticatedUser, familyId: string): Promise<void> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
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
      throw new ForbiddenException('Admin access required for this family');
    }
  }

  private async verifyMemberAccess(user: AuthenticatedUser, memberId: string): Promise<void> {
    if (!user.memberId) {
      throw new NotFoundException('Member profile not found');
    }

    // Get user's families
    const userFamilies = await this.prisma.familyMembership.findMany({
      where: {
        memberId: user.memberId,
        isActive: true,
      },
      select: { familyId: true },
    });

    const userFamilyIds = userFamilies.map(f => f.familyId);

    // Check if target member is in any of user's families
    const targetMemberFamilies = await this.prisma.familyMembership.findMany({
      where: {
        memberId,
        isActive: true,
        familyId: { in: userFamilyIds },
      },
    });

    if (targetMemberFamilies.length === 0) {
      throw new ForbiddenException('Access denied to this member');
    }
  }
}
