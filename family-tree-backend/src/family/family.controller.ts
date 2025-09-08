import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { FamilyService } from "./family.service";
import {
  CreateFamilyDto,
  UpdateFamilyDto,
  UpdateFamilyMembershipDto,
  AddMemberToFamilyDto,
  FamilyResponseDto,
  FamilyWithMembersDto,
} from "./dto/family.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("Families")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("families")
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @ApiOperation({
    summary: "Create new family",
    description: "Create a new family or sub-family",
  })
  @ApiResponse({
    status: 201,
    description: "Family created successfully",
    type: FamilyResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Access denied",
  })
  async createFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateFamilyDto
  ): Promise<FamilyResponseDto> {
    return this.familyService.createFamily(user, createDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get my families",
    description: "Get all families the current user is a member of",
  })
  @ApiResponse({
    status: 200,
    description: "Families retrieved successfully",
    type: [FamilyResponseDto],
  })
  async getMyFamilies(
    @CurrentUser() user: AuthenticatedUser
  ): Promise<FamilyResponseDto[]> {
    return this.familyService.getFamilies(user);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get family details",
    description:
      "Get detailed information about a specific family including members",
  })
  @ApiResponse({
    status: 200,
    description: "Family details retrieved successfully",
    type: FamilyWithMembersDto,
  })
  @ApiResponse({
    status: 403,
    description: "Access denied to this family",
  })
  @ApiResponse({
    status: 404,
    description: "Family not found",
  })
  async getFamilyDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string
  ): Promise<FamilyWithMembersDto> {
    return this.familyService.getFamilyDetails(user, familyId);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update family",
    description: "Update family information (requires admin access)",
  })
  @ApiResponse({
    status: 200,
    description: "Family updated successfully",
    type: FamilyResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async updateFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string,
    @Body() updateDto: UpdateFamilyDto
  ): Promise<FamilyResponseDto> {
    return this.familyService.updateFamily(user, familyId, updateDto);
  }

  @Post(":id/members")
  @ApiOperation({
    summary: "Add member to family",
    description: "Add a member to the family (requires admin access)",
  })
  @ApiResponse({
    status: 201,
    description: "Member added successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async addMemberToFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string,
    @Body() addMemberDto: AddMemberToFamilyDto
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.addMemberToFamily(user, familyId, addMemberDto);
    return { success: true, message: "Member added to family successfully" };
  }

  @Patch(":id/members/:memberId")
  @ApiOperation({
    summary: "Update family membership",
    description:
      "Update a member's role and status in the family (requires admin access)",
  })
  @ApiResponse({
    status: 200,
    description: "Membership updated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async updateFamilyMembership(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string,
    @Param("memberId") memberId: string,
    @Body() updateDto: UpdateFamilyMembershipDto
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.updateFamilyMembership(
      user,
      familyId,
      memberId,
      updateDto
    );
    return { success: true, message: "Membership updated successfully" };
  }

  @Delete(":id/members/:memberId")
  @ApiOperation({
    summary: "Remove member from family",
    description: "Remove a member from the family (requires admin access)",
  })
  @ApiResponse({
    status: 200,
    description: "Member removed successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async removeMemberFromFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string,
    @Param("memberId") memberId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.removeMemberFromFamily(user, familyId, memberId);
    return {
      success: true,
      message: "Member removed from family successfully",
    };
  }

  @Post(":id/subfamily/recalculate")
  @ApiOperation({
    summary: "Recalculate sub-family memberships",
    description:
      "Automatically recalculate sub-family memberships based on relationships",
  })
  @ApiResponse({
    status: 200,
    description: "Sub-family memberships recalculated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async recalculateSubFamilyMemberships(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.recalculateSubFamilyMemberships(familyId);
    return {
      success: true,
      message: "Sub-family memberships recalculated successfully",
    };
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Soft delete family",
    description: "Soft delete a family (only creator can delete)",
  })
  @ApiResponse({
    status: 200,
    description: "Family soft deleted successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only creator can delete family",
  })
  async softDeleteFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.softDeleteFamily(user, familyId);
    return { success: true, message: "Family deleted successfully" };
  }

  @Post(":id/restore")
  @ApiOperation({
    summary: "Restore family",
    description: "Restore a soft deleted family (only creator can restore)",
  })
  @ApiResponse({
    status: 200,
    description: "Family restored successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only creator can restore family",
  })
  async restoreFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.restoreFamily(user, familyId);
    return { success: true, message: "Family restored successfully" };
  }

  // Legacy hard delete method (kept for backward compatibility)
  @Delete(":id/hard")
  @ApiOperation({
    summary: "Hard delete family",
    description: "Permanently delete a family (only creator can delete)",
  })
  @ApiResponse({
    status: 200,
    description: "Family hard deleted successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only creator can delete family",
  })
  async deleteFamily(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") familyId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.familyService.deleteFamily(user, familyId);
    return {
      success: true,
      message: "Family permanently deleted successfully",
    };
  }
}
