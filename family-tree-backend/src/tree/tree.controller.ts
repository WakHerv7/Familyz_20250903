import { Controller, Get, Post, Body, Param, Query, UseGuards, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { TreeService } from './tree.service';
import {
  FamilyTreeDto,
  ExportTreeDto,
  TreeStatisticsDto,
  TreeFormat
} from './dto/tree.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Family Tree')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Get(':familyId')
  @ApiOperation({
    summary: 'Get family tree',
    description: 'Get the complete family tree structure for visualization',
  })
  @ApiQuery({
    name: 'centerMemberId',
    required: false,
    description: 'ID of the member to center the tree around',
  })
  @ApiResponse({
    status: 200,
    description: 'Family tree retrieved successfully',
    type: FamilyTreeDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this family',
  })
  @ApiResponse({
    status: 404,
    description: 'Family not found',
  })
  async getFamilyTree(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId') familyId: string,
    @Query('centerMemberId') centerMemberId?: string,
  ): Promise<FamilyTreeDto> {
    return this.treeService.getFamilyTree(user, familyId, centerMemberId);
  }

  @Get(':familyId/statistics')
  @ApiOperation({
    summary: 'Get family tree statistics',
    description: 'Get statistical information about the family tree',
  })
  @ApiResponse({
    status: 200,
    description: 'Tree statistics retrieved successfully',
    type: TreeStatisticsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this family',
  })
  async getTreeStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId') familyId: string,
  ): Promise<TreeStatisticsDto> {
    return this.treeService.getTreeStatistics(user, familyId);
  }

  @Post('export')
  @ApiOperation({
    summary: 'Export family tree',
    description: 'Export family tree data in various formats (JSON, CSV, PDF)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tree exported successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this family',
  })
  async exportFamilyTree(
    @CurrentUser() user: AuthenticatedUser,
    @Body() exportDto: ExportTreeDto,
    @Res() res: Response,
  ): Promise<void> {
    const exportData = await this.treeService.exportFamilyTree(user, exportDto);

    // Set appropriate headers based on format
    let contentType: string;
    let filename: string;

    switch (exportDto.format) {
      case TreeFormat.JSON:
        contentType = 'application/json';
        filename = `family-tree-${exportDto.familyId}.json`;
        break;
      case TreeFormat.CSV:
        contentType = 'text/csv';
        filename = `family-tree-${exportDto.familyId}.csv`;
        break;
      case TreeFormat.PDF:
        contentType = 'application/pdf';
        filename = `family-tree-${exportDto.familyId}.pdf`;
        break;
      default:
        contentType = 'application/octet-stream';
        filename = `family-tree-${exportDto.familyId}`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (exportData instanceof Buffer) {
      res.send(exportData);
    } else {
      res.send(exportData);
    }
  }

  @Get(':familyId/relationships/:memberId')
  @ApiOperation({
    summary: 'Get member relationships',
    description: 'Get detailed relationship information for a specific member',
  })
  @ApiResponse({
    status: 200,
    description: 'Member relationships retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this member',
  })
  async getMemberRelationships(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
  ): Promise<{
    member: any;
    directRelationships: any[];
    indirectRelationships: any[];
    relationshipPath: any[];
  }> {
    // This would be implemented to show relationship paths
    // For now, return a basic structure
    return {
      member: { id: memberId },
      directRelationships: [],
      indirectRelationships: [],
      relationshipPath: [],
    };
  }

  @Get(':familyId/generations')
  @ApiOperation({
    summary: 'Get generation breakdown',
    description: 'Get members organized by generation levels',
  })
  @ApiResponse({
    status: 200,
    description: 'Generation breakdown retrieved successfully',
  })
  async getGenerationBreakdown(
    @CurrentUser() user: AuthenticatedUser,
    @Param('familyId') familyId: string,
  ): Promise<{
    [generation: number]: Array<{
      id: string;
      name: string;
      gender?: string;
      status: string;
    }>;
  }> {
    const treeData = await this.treeService.getFamilyTree(user, familyId);

    const generations: { [generation: number]: any[] } = {};

    for (const node of treeData.nodes) {
      if (!generations[node.level]) {
        generations[node.level] = [];
      }

      generations[node.level].push({
        id: node.id,
        name: node.name,
        gender: node.gender,
        status: node.status,
      });
    }

    return generations;
  }
}
