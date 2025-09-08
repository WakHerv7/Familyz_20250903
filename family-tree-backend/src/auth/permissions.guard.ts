import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { FamilyPermission, DEFAULT_ROLE_PERMISSIONS } from "./permissions.enum";
import { FamilyRole } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    memberId: string;
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<FamilyPermission[]>(
      "permissions",
      context.getHandler()
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.memberId) {
      throw new ForbiddenException("User not authenticated");
    }

    // Extract family ID from request parameters or body
    const familyId = await this.extractFamilyId(request, context);

    if (!familyId) {
      throw new ForbiddenException("Family ID not found in request");
    }

    // Check if user has the required permissions for this family
    const hasPermission = await this.checkPermissions(
      user.memberId,
      familyId,
      requiredPermissions
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        "You do not have permission to perform this action"
      );
    }

    return true;
  }

  private async extractFamilyId(
    request: AuthenticatedRequest,
    context: ExecutionContext
  ): Promise<string | null> {
    // Try to extract from route parameters
    const params = context.switchToHttp().getRequest().params;

    // For member operations (like PUT /members/:id), we need to get familyId from the member
    if (params.id && this.isMemberOperation(context)) {
      return this.getFamilyIdFromMember(params.id, request.user.memberId);
    }

    if (params.familyId) {
      return params.familyId;
    }

    // Try to extract from request body
    const body = context.switchToHttp().getRequest().body;
    if (body && body.familyId) {
      return body.familyId;
    }

    // Try to extract from query parameters
    const query = context.switchToHttp().getRequest().query;
    if (query && query.familyId) {
      return query.familyId;
    }

    return null;
  }

  private isMemberOperation(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.route?.path || request.url;

    // Check if this is a member-related operation
    return path.includes("/members/") && !path.includes("/members/family/");
  }

  private async getFamilyIdFromMember(
    memberId: string,
    userMemberId: string
  ): Promise<string | null> {
    try {
      // Get the target member's family membership
      const targetMembership = await this.prisma.familyMembership.findFirst({
        where: {
          memberId: memberId,
          isActive: true,
        },
        select: {
          familyId: true,
        },
      });

      if (!targetMembership) {
        return null;
      }

      // Verify that the user is also a member of the same family
      const userMembership = await this.prisma.familyMembership.findFirst({
        where: {
          memberId: userMemberId,
          familyId: targetMembership.familyId,
          isActive: true,
        },
        select: {
          familyId: true,
        },
      });

      return userMembership ? targetMembership.familyId : null;
    } catch (error) {
      console.error("Error getting family ID from member:", error);
      return null;
    }
  }

  private async checkPermissions(
    memberId: string,
    familyId: string,
    requiredPermissions: FamilyPermission[]
  ): Promise<boolean> {
    try {
      // Get the member's family membership
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
        return false; // User is not a member of this family
      }

      // Check if user is family admin/head (they have all permissions)
      if (
        membership.role === FamilyRole.ADMIN ||
        membership.role === FamilyRole.HEAD
      ) {
        return true;
      }

      // Get user's specific permissions from the database
      const userPermissions = await this.prisma.familyMemberPermission.findMany(
        {
          where: {
            familyMemberId: membership.id,
          },
          select: {
            permission: true,
          },
        }
      );

      const userPermissionStrings = userPermissions.map((p) => p.permission);

      // Check if user has all required permissions
      return requiredPermissions.every((requiredPermission) =>
        userPermissionStrings.includes(requiredPermission)
      );
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  }
}
