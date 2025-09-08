"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const import_service_1 = require("./import.service");
const template_service_1 = require("./template.service");
const import_dto_1 = require("./dto/import.dto");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_enum_1 = require("../auth/permissions.enum");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ImportController = class ImportController {
    constructor(importService, templateService) {
        this.importService = importService;
        this.templateService = templateService;
    }
    async validateFile(file, body) {
        if (!file) {
            throw new common_1.BadRequestException("No file provided");
        }
        try {
            const result = await this.importService.validateFile(file);
            return {
                success: result.isValid,
                fileType: result.fileType,
                errors: result.errors,
                warnings: result.warnings || [],
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Validation failed: ${error.message}`);
        }
    }
    async startImport(user, file, body) {
        if (!file) {
            throw new common_1.BadRequestException("No file provided");
        }
        try {
            const importId = await this.importService.startImport(file, user.userId, body.familyId, body.importName);
            return {
                success: true,
                importId,
                message: "Import started successfully. Use the import ID to check progress.",
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to start import: ${error.message}`);
        }
    }
    async getImportProgress(importId) {
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
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to get import progress: ${error.message}`);
        }
    }
    async rollbackImport(importId) {
        try {
            const success = await this.importService.rollbackImport(importId);
            if (!success) {
                throw new common_1.BadRequestException("Cannot rollback this import. It may not exist, be incomplete, or already rolled back.");
            }
            return {
                success: true,
                message: "Import rolled back successfully",
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Failed to rollback import: ${error.message}`);
        }
    }
    async downloadJsonTemplate(sampleData = "true", size = "medium") {
        const includeSampleData = sampleData === "true";
        const templateSize = size;
        const template = await this.templateService.generateJsonTemplate(includeSampleData, templateSize);
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
    async downloadExcelTemplate(response, sampleData = "true", size = "medium") {
        const includeSampleData = sampleData === "true";
        const templateSize = size;
        await this.templateService.sendExcelTemplate(response, includeSampleData, templateSize);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)("validate"),
    (0, swagger_1.ApiOperation)({ summary: "Validate import file before processing" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "File validation result" }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, import_dto_1.ValidateImportDto]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "validateFile", null);
__decorate([
    (0, common_1.Post)("start"),
    (0, swagger_1.ApiOperation)({ summary: "Start import process" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Import started successfully" }),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.ADD_MEMBERS),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, import_dto_1.StartImportDto]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "startImport", null);
__decorate([
    (0, common_1.Get)("progress/:importId"),
    (0, swagger_1.ApiOperation)({ summary: "Get import progress" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Import progress information" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Import not found" }),
    __param(0, (0, common_1.Param)("importId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "getImportProgress", null);
__decorate([
    (0, common_1.Delete)("rollback/:importId"),
    (0, swagger_1.ApiOperation)({ summary: "Rollback completed import" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Import rolled back successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot rollback import" }),
    (0, permissions_decorator_1.Permissions)(permissions_enum_1.FamilyPermission.MANAGE_FAMILY_SETTINGS),
    __param(0, (0, common_1.Param)("importId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "rollbackImport", null);
__decorate([
    (0, common_1.Get)("template/json"),
    (0, swagger_1.ApiOperation)({ summary: "Download JSON import template" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "JSON template file download" }),
    __param(0, (0, common_1.Query)("sampleData")),
    __param(1, (0, common_1.Query)("size")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "downloadJsonTemplate", null);
__decorate([
    (0, common_1.Get)("template/excel"),
    (0, swagger_1.ApiOperation)({ summary: "Download Excel import template" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Excel template file download" }),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)("sampleData")),
    __param(2, (0, common_1.Query)("size")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "downloadExcelTemplate", null);
exports.ImportController = ImportController = __decorate([
    (0, swagger_1.ApiTags)("Import"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("import"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [import_service_1.ImportService,
        template_service_1.TemplateService])
], ImportController);
//# sourceMappingURL=import.controller.js.map