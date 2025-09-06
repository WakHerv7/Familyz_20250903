import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";
import * as path from "path";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExportService } from "./export.service";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    memberId: string;
  };
}

interface ExportConfig {
  formats: ("pdf" | "excel")[];
  familyTree: {
    structure: "folderTree" | "traditional" | "interactive" | "textTree";
    includeMembersList: boolean;
    memberDetails: (
      | "parent"
      | "children"
      | "spouses"
      | "personalInfo"
      | "contact"
    )[];
  };
}

interface ExportRequest {
  format: "pdf" | "excel";
  scope: "current-family" | "all-families" | "selected-families";
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

@Controller("export")
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get("folder-tree-data")
  @UseGuards(JwtAuthGuard)
  async getFolderTreeData(
    @Request() req: AuthenticatedRequest
  ): Promise<FolderTreeExportData> {
    return await this.exportService.getFolderTreeData(req.user.memberId);
  }

  @Get("explorer-tree-data")
  @UseGuards(JwtAuthGuard)
  async getExplorerTreeData(
    @Request() req: AuthenticatedRequest
  ): Promise<{ column: number; value: string }[]> {
    return await this.exportService.getExplorerTreeData(req.user.memberId);
  }

  @Get("folder-tree-data-with-ids")
  @UseGuards(JwtAuthGuard)
  async getFolderTreeDataWithIds(
    @Request() req: AuthenticatedRequest
  ): Promise<
    {
      column: number;
      value: string;
      memberIds: { id: string; name: string; gender: string }[];
    }[]
  > {
    return await this.exportService.getFolderTreeDataWithIds(req.user.memberId);
  }

  @Get("download/:filename")
  async downloadFile(
    @Param("filename") filename: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "exports",
        filename
      );

      // Check if file exists
      if (!require("fs").existsSync(filePath)) {
        throw new BadRequestException("File not found");
      }

      // Set appropriate headers based on file extension
      const ext = filename.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";

      if (ext === "pdf") {
        contentType = "application/pdf";
      } else if (ext === "xlsx" || ext === "xls") {
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      // Stream the file
      const fileStream = require("fs").createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Download failed:", error);
      throw new BadRequestException("Download failed: " + error.message);
    }
  }

  @Post("family-data")
  @UseGuards(JwtAuthGuard)
  async exportFamilyData(
    @Body() exportRequest: ExportRequest,
    @Request() req: AuthenticatedRequest
  ): Promise<{ downloadUrl: string; filename: string }> {
    if (!exportRequest.format || !exportRequest.scope) {
      throw new BadRequestException("Format and scope are required");
    }

    try {
      const result = await this.exportService.exportFamilyData(
        req.user.memberId,
        exportRequest
      );

      return result;
    } catch (error) {
      console.error("Export failed:", error);
      throw new BadRequestException("Export failed: " + error.message);
    }
  }
}
