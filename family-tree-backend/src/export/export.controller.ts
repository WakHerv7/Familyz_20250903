import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from './export.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    memberId: string;
  };
}

interface ExportConfig {
  formats: ('pdf' | 'excel')[];
  familyTree: {
    structure: 'folderTree' | 'traditional' | 'interactive';
    includeMembersList: boolean;
    memberDetails: ('parent' | 'children' | 'spouses' | 'personalInfo' | 'contact')[];
  };
}

interface ExportRequest {
  format: 'pdf' | 'excel';
  scope: 'current-family' | 'all-families' | 'selected-families';
  familyIds?: string[];
  config: ExportConfig;
  includeData: {
    personalInfo: boolean;
    relationships: boolean;
    contactInfo: boolean;
    profileImages: boolean;
  };
}

interface FolderTreeExportData {
  families: {
    id: string;
    name: string;
    members: {
      id: string;
      name: string;
      role: string;
      generation: number;
      parents: any[];
      children: any[];
      spouses: any[];
      personalInfo?: any;
    }[];
  }[];
  membersList: any[];
  generatedAt: Date;
  exportConfig: ExportConfig;
}

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('folder-tree-data')
  async getFolderTreeData(
    @Request() req: AuthenticatedRequest,
  ): Promise<FolderTreeExportData> {
    return await this.exportService.getFolderTreeData(req.user.memberId);
  }

  @Post('family-data')
  async exportFamilyData(
    @Body() exportRequest: ExportRequest,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    if (!exportRequest.format || !exportRequest.scope) {
      throw new BadRequestException('Format and scope are required');
    }

    try {
      const exportData = await this.exportService.exportFamilyData(
        req.user.memberId,
        exportRequest,
      );

      // Set appropriate headers based on format
      let contentType: string;
      let filename: string;
      let fileExtension: string;

      switch (exportRequest.format) {
        case 'pdf':
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        default:
          contentType = 'application/octet-stream';
          fileExtension = 'bin';
      }

      const timestamp = new Date().toISOString().split('T')[0];
      filename = `family-tree-${exportRequest.format}-${timestamp}.${fileExtension}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      res.send(exportData);
    } catch (error) {
      console.error('Export failed:', error);
      throw new BadRequestException('Export failed: ' + error.message);
    }
  }
}
