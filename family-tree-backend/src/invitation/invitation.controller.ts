import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationResponseDto,
  InvitationValidationDto
} from './dto/invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create family invitation',
    description: 'Create an invitation code for someone to join a family',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to family',
  })
  async createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.invitationService.createInvitation(user, createDto);
  }

  @Get('validate')
  @Public()
  @ApiOperation({
    summary: 'Validate invitation code',
    description: 'Check if an invitation code is valid and get family information',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation validation result',
    type: InvitationValidationDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async validateInvitation(
    @Query('code') code: string,
  ): Promise<InvitationValidationDto> {
    return this.invitationService.validateInvitationCode(code);
  }

  @Post('accept')
  @Public()
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accept an invitation and create user account',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid invitation or user already exists',
  })
  async acceptInvitation(
    @Body() acceptDto: AcceptInvitationDto,
  ): Promise<{ success: boolean; message: string; accessToken: string; user: any }> {
    return this.invitationService.acceptInvitation(acceptDto);
  }

  @Get('family/:familyId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get family invitations',
    description: 'Get all invitations for a specific family',
  })
  @ApiResponse({
    status: 200,
    description: 'Family invitations retrieved successfully',
    type: [InvitationResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to family',
  })
  async getFamilyInvitations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId') familyId: string,
  ): Promise<InvitationResponseDto[]> {
    return this.invitationService.getFamilyInvitations(user, familyId);
  }

  @Get('my-invitations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get my sent invitations',
    description: 'Get all invitations sent by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'User invitations retrieved successfully',
    type: [InvitationResponseDto],
  })
  async getMyInvitations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvitationResponseDto[]> {
    return this.invitationService.getUserInvitations(user);
  }
}
