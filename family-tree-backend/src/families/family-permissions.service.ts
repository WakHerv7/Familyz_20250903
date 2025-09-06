import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  FamilyPermission,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_DISPLAY_NAMES,
  PERMISSION_DESCRIPTIONS,
} from "../auth/permissions.enum";
import { FamilyRole } from "@prisma/client";

@Injectable()
export class FamilyPermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all permissions for a specific family member
   */
  async getMemberPermissions(familyId: string, memberId: string) {
    // Verify the member belongs to the family
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
      throw new NotFoundException("Member not found in this family");
    }

    // Get member's specific permissions
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
        displayName: PERMISSION_DISPLAY_NAMES[p.permission as FamilyPermission],
        description: PERMISSION_DESCRIPTIONS[p.permission as FamilyPermission],
        grantedBy: p.grantedBy,
        grantedAt: p.grantedAt,
      })),
    };
  }

  /**
   * Grant a permission to a family member
   */
  async grantPermission(
    familyId: string,
    memberId: string,
    permission: FamilyPermission,
    grantedBy: string
  ) {
    // Verify the member belongs to the family
    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: memberId,
        familyId: familyId,
      },
    });

    if (!membership) {
      throw new NotFoundException("Member not found in this family");
    }

    // Check if permission already exists
    const existingPermission =
      await this.prisma.familyMemberPermission.findFirst({
        where: {
          familyMemberId: membership.id,
          permission: permission,
        },
      });

    if (existingPermission) {
      throw new ForbiddenException("Member already has this permission");
    }

    // Grant the permission
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
        displayName: PERMISSION_DISPLAY_NAMES[permission],
        grantedBy: newPermission.grantedBy,
        grantedAt: newPermission.grantedAt,
      },
    };
  }

  /**
   * Revoke a permission from a family member
   */
  async revokePermission(
    familyId: string,
    memberId: string,
    permission: FamilyPermission
  ) {
    // Verify the member belongs to the family
    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: memberId,
        familyId: familyId,
      },
    });

    if (!membership) {
      throw new NotFoundException("Member not found in this family");
    }

    // Find and delete the permission
    const deletedPermission =
      await this.prisma.familyMemberPermission.deleteMany({
        where: {
          familyMemberId: membership.id,
          permission: permission,
        },
      });

    if (deletedPermission.count === 0) {
      throw new NotFoundException("Permission not found");
    }

    return {
      message: "Permission revoked successfully",
      permission: permission,
    };
  }

  /**
   * Update multiple permissions for a family member
   */
  async updateMemberPermissions(
    familyId: string,
    memberId: string,
    permissions: FamilyPermission[],
    updatedBy: string
  ) {
    // Verify the member belongs to the family
    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: memberId,
        familyId: familyId,
      },
    });

    if (!membership) {
      throw new NotFoundException("Member not found in this family");
    }

    // Remove all existing permissions for this member
    await this.prisma.familyMemberPermission.deleteMany({
      where: {
        familyMemberId: membership.id,
      },
    });

    // Add new permissions
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

  /**
   * Get all family members with their permissions
   */
  async getFamilyPermissions(familyId: string) {
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
        displayName: PERMISSION_DISPLAY_NAMES[p.permission as FamilyPermission],
        grantedAt: p.grantedAt,
      })),
      permissionCount: membership.familyMemberPermissions.length,
    }));
  }

  /**
   * Reset member permissions to role defaults
   */
  async resetMemberPermissions(
    familyId: string,
    memberId: string,
    resetBy: string
  ) {
    // Verify the member belongs to the family
    const membership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: memberId,
        familyId: familyId,
      },
    });

    if (!membership) {
      throw new NotFoundException("Member not found in this family");
    }

    // Get default permissions for the member's role
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[membership.role] || [];

    // Remove all existing permissions
    await this.prisma.familyMemberPermission.deleteMany({
      where: {
        familyMemberId: membership.id,
      },
    });

    // Add default permissions
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

  /**
   * Get available permissions with descriptions
   */
  async getAvailablePermissions() {
    const permissions = Object.values(FamilyPermission).map((permission) => ({
      permission,
      displayName: PERMISSION_DISPLAY_NAMES[permission],
      description: PERMISSION_DESCRIPTIONS[permission],
    }));

    return {
      permissions,
      total: permissions.length,
    };
  }
}
