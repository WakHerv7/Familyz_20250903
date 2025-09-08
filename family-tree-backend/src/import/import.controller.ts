import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ImportService } from "./import.service";
import { TemplateService } from "./template.service";
import {
  StartImportDto,
  ImportProgressDto,
  ValidateImportDto,
  RollbackImportDto,
} from "./dto/import.dto";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions } from "../auth/permissions.decorator";
import { FamilyPermission } from "../auth/permissions.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ImportProgress } from "./interfaces/import.interface";

@ApiTags("Import")
@ApiBearerAuth()
@Controller("import")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly templateService: TemplateService
  ) {}

  @Post("validate")
  @ApiOperation({ summary: "Validate import file before processing" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "File to validate",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Excel or JSON file to validate",
        },
        familyId: {
          type: "string",
          description: "Optional family ID for context",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "File validation result" })
  @UseInterceptors(FileInterceptor("file"))
  async validateFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ValidateImportDto
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    try {
      const result = await this.importService.validateFile(file);
      return {
        success: result.isValid,
        fileType: result.fileType,
        errors: result.errors,
        warnings: result.warnings || [],
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Validation failed: ${error.message}`
      );
    }
  }

  @Post("start")
  @ApiOperation({ summary: "Start import process" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Import configuration and file",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Excel or JSON file to import",
        },
        familyId: {
          type: "string",
          description: "Optional family ID to import into",
        },
        importName: {
          type: "string",
          description: "Optional name for this import batch",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Import started successfully" })
  @Permissions(FamilyPermission.ADD_MEMBERS)
  @UseInterceptors(FileInterceptor("file"))
  async startImport(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: StartImportDto
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    try {
      const importId = await this.importService.startImport(
        file,
        user.userId,
        body.familyId,
        body.importName
      );

      return {
        success: true,
        importId,
        message:
          "Import started successfully. Use the import ID to check progress.",
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to start import: ${error.message}`
      );
    }
  }

  @Get("progress/:importId")
  @ApiOperation({ summary: "Get import progress" })
  @ApiResponse({ status: 200, description: "Import progress information" })
  @ApiResponse({ status: 404, description: "Import not found" })
  async getImportProgress(@Param("importId") importId: string) {
    try {
      const progress = await this.importService.getImportProgress(importId);

      if (!progress) {
        return {
          success: false,
          message: "Import not found or has expired",
        };
      }

      return {
        success: true,
        progress,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get import progress: ${error.message}`
      );
    }
  }

  @Delete("rollback/:importId")
  @ApiOperation({ summary: "Rollback completed import" })
  @ApiResponse({ status: 200, description: "Import rolled back successfully" })
  @ApiResponse({ status: 400, description: "Cannot rollback import" })
  @Permissions(FamilyPermission.MANAGE_FAMILY_SETTINGS)
  async rollbackImport(@Param("importId") importId: string) {
    try {
      const success = await this.importService.rollbackImport(importId);

      if (!success) {
        throw new BadRequestException(
          "Cannot rollback this import. It may not exist, be incomplete, or already rolled back."
        );
      }

      return {
        success: true,
        message: "Import rolled back successfully",
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to rollback import: ${error.message}`
      );
    }
  }

  @Get("template/json")
  @ApiOperation({ summary: "Download JSON import template" })
  @ApiResponse({ status: 200, description: "JSON template file download" })
  async downloadJsonTemplate(
    @Query("sampleData") sampleData: string = "true",
    @Query("size") size: string = "medium"
  ) {
    const includeSampleData = sampleData === "true";
    const templateSize = size as "small" | "medium" | "large";

    const template = await this.templateService.generateJsonTemplate(
      includeSampleData,
      templateSize
    );

    return {
      success: true,
      template,
      instructions: `
JSON Import Template Instructions:

1. Use this structure to format your family data
2. Required field: name (string)
3. Optional fields: gender, status, color, personalInfo, parentNames, spouseNames, familyName, familyRole
4. Gender values: MALE, FEMALE, OTHER
5. Status values: ACTIVE, INACTIVE, DECEASED, ARCHIVED
6. Family role values: ADMIN, MEMBER, HEAD, VIEWER
7. parentNames and spouseNames should be arrays of strings
8. personalInfo is an object with bio, birthDate, birthPlace, occupation, socialLinks
9. socialLinks is an object with platform names as keys and URLs as values

Example:
{
  "name": "Smith Family",
  "members": [
    {
      "name": "John Smith",
      "gender": "MALE",
      "parentNames": ["Robert Smith"],
      "spouseNames": ["Jane Smith"]
    }
  ]
}
      `.trim(),
    };
  }

  @Get("template/excel")
  @ApiOperation({ summary: "Download Excel import template" })
  @ApiResponse({ status: 200, description: "Excel template file download" })
  async downloadExcelTemplate(
    @Res() response: Response,
    @Query("sampleData") sampleData: string = "true",
    @Query("size") size: string = "medium"
  ) {
    const includeSampleData = sampleData === "true";
    const templateSize = size as "small" | "medium" | "large";

    await this.templateService.sendExcelTemplate(
      response,
      includeSampleData,
      templateSize
    );
  }
}
