import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { MemberService } from "./member.service";
import {
  UpdateMemberProfileDto,
  AddRelationshipDto,
  RemoveRelationshipDto,
  BulkRelationshipDto,
  CreateMemberDto,
  MemberRelationshipsResponseDto,
  MemberResponseDto,
} from "./dto/member.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions, RequirePermission } from "../auth/permissions.decorator";
import { FamilyPermission } from "../auth/permissions.enum";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("Members")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get("profile")
  @ApiOperation({
    summary: "Get my profile",
    description: "Get current user's member profile with all relationships",
  })
  @ApiResponse({
    status: 200,
    description: "Profile retrieved successfully",
    type: MemberRelationshipsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Member profile not found",
  })
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser
  ): Promise<MemberRelationshipsResponseDto> {
    return this.memberService.getProfile(user);
  }

  @Put("profile")
  @Permissions(FamilyPermission.EDIT_OWN_PROFILE)
  @ApiOperation({
    summary: "Update my profile",
    description: "Update current user's member profile information",
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    type: MemberResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Member profile not found",
  })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateMemberProfileDto
  ): Promise<MemberResponseDto> {
    return this.memberService.updateProfile(user, updateDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get member details",
    description: "Get details of a specific member (must be in same family)",
  })
  @ApiResponse({
    status: 200,
    description: "Member details retrieved successfully",
    type: MemberRelationshipsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Member not found",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - member not in your families",
  })
  async getMemberDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") memberId: string
  ): Promise<MemberRelationshipsResponseDto> {
    return this.memberService.getMemberDetails(user, memberId);
  }

  @Post("relationships")
  @Permissions(FamilyPermission.EDIT_MEMBERS)
  @ApiOperation({
    summary: "Add relationship",
    description:
      "Add a parent, spouse, or child relationship with another member",
  })
  @ApiResponse({
    status: 201,
    description: "Relationship added successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid relationship or member already related",
  })
  @ApiResponse({
    status: 403,
    description:
      "Access denied - cannot relate to member outside your families",
  })
  async addRelationship(
    @CurrentUser() user: AuthenticatedUser,
    @Body() relationshipDto: AddRelationshipDto
  ): Promise<{ success: boolean; message: string }> {
    return this.memberService.addRelationship(user, relationshipDto);
  }

  @Delete("relationships")
  @HttpCode(200)
  @Permissions(FamilyPermission.EDIT_MEMBERS)
  @ApiOperation({
    summary: "Remove relationship",
    description:
      "Remove a parent, spouse, or child relationship with another member",
  })
  @ApiResponse({
    status: 200,
    description: "Relationship removed successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Relationship not found",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied",
  })
  async removeRelationship(
    @CurrentUser() user: AuthenticatedUser,
    @Body() relationshipDto: RemoveRelationshipDto
  ): Promise<{ success: boolean; message: string }> {
    return this.memberService.removeRelationship(user, relationshipDto);
  }

  @Post("relationships/bulk")
  @Permissions(FamilyPermission.EDIT_MEMBERS)
  @ApiOperation({
    summary: "Add multiple relationships",
    description: "Add multiple relationships in a single operation",
  })
  @ApiResponse({
    status: 201,
    description: "Bulk relationships processed",
  })
  @ApiResponse({
    status: 400,
    description: "Some relationships failed to be created",
  })
  async addBulkRelationships(
    @CurrentUser() user: AuthenticatedUser,
    @Body() bulkDto: BulkRelationshipDto
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    return this.memberService.addBulkRelationships(user, bulkDto);
  }

  @Post()
  @Permissions(FamilyPermission.ADD_MEMBERS)
  @ApiOperation({
    summary: "Create new member",
    description: "Create a new member in a family (requires family access)",
  })
  @ApiResponse({
    status: 201,
    description: "Member created successfully",
    type: MemberResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - not a member of this family",
  })
  @ApiResponse({
    status: 404,
    description: "Family not found",
  })
  async createMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateMemberDto
  ): Promise<MemberResponseDto> {
    return this.memberService.createMember(user, createDto);
  }

  @Get("family/:familyId")
  @Permissions(FamilyPermission.VIEW_MEMBERS)
  @ApiOperation({
    summary: "Get family members",
    description: "Get all members in a specific family",
  })
  @ApiResponse({
    status: 200,
    description: "Family members retrieved successfully",
    type: [MemberResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - not a member of this family",
  })
  async getFamilyMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("familyId") familyId: string
  ): Promise<MemberResponseDto[]> {
    return this.memberService.getFamilyMembers(user, familyId);
  }
}
