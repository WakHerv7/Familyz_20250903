import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions, RequirePermission } from "../auth/permissions.decorator";
import { FamilyPermission } from "../auth/permissions.enum";
import { FamilyPermissionsService } from "./family-permissions.service";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    memberId: string;
  };
}

@Controller("families")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FamilyPermissionsController {
  constructor(private readonly permissionsService: FamilyPermissionsService) {}

  /**
   * Get all permissions for a specific family member
   */
  @Get(":familyId/members/:memberId/permissions")
  @Permissions(FamilyPermission.MANAGE_PERMISSIONS)
  async getMemberPermissions(
    @Param("familyId") familyId: string,
    @Param("memberId") memberId: string
  ) {
    return await this.permissionsService.getMemberPermissions(
      familyId,
      memberId
    );
  }

  /**
   * Grant a permission to a family member
   */
  @Post(":familyId/members/:memberId/permissions")
  @Permissions(FamilyPermission.MANAGE_PERMISSIONS)
  async grantPermission(
    @Param("familyId") familyId: string,
    @Param("memberId") memberId: string,
    @Body() body: { permission: FamilyPermission },
    @Request() req: AuthenticatedRequest
  ) {
    return await this.permissionsService.grantPermission(
      familyId,
      memberId,
      body.permission,
      req.user.memberId
    );
  }

  /**
   * Revoke a permission from a family member
   */
  @Delete(":familyId/members/:memberId/permissions/:permission")
  @Permissions(FamilyPermission.MANAGE_PERMISSIONS)
  async revokePermission(
    @Param("familyId") familyId: string,
    @Param("memberId") memberId: string,
    @Param("permission") permission: FamilyPermission
  ) {
    return await this.permissionsService.revokePermission(
      familyId,
      memberId,
      permission
    );
  }

  /**
   * Update multiple permissions for a family member
   */
  @Put(":familyId/members/:memberId/permissions")
  @Permissions(FamilyPermission.MANAGE_PERMISSIONS)
  async updateMemberPermissions(
    @Param("familyId") familyId: string,
    @Param("memberId") memberId: string,
    @Body() body: { permissions: FamilyPermission[] },
    @Request() req: AuthenticatedRequest
  ) {
    return await this.permissionsService.updateMemberPermissions(
      familyId,
      memberId,
      body.permissions,
      req.user.memberId
    );
  }

  /**
   * Get all family members with their permissions
   */
  @Get(":familyId/permissions")
  @Permissions(FamilyPermission.MANAGE_PERMISSIONS)
  async getFamilyPermissions(@Param("familyId") familyId: string) {
    return await this.permissionsService.getFamilyPermissions(familyId);
  }

  /**
   * Reset member permissions to role defaults
   */
  @Post(":familyId/members/:memberId/permissions/reset")
  @Permissions(FamilyPermission.MANAGE_PERMISSIONS)
  async resetMemberPermissions(
    @Param("familyId") familyId: string,
    @Param("memberId") memberId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.permissionsService.resetMemberPermissions(
      familyId,
      memberId,
      req.user.memberId
    );
  }

  /**
   * Get available permissions with descriptions
   */
  @Get("permissions/available")
  async getAvailablePermissions() {
    return await this.permissionsService.getAvailablePermissions();
  }
}
