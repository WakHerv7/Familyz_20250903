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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const export_service_1 = require("./export.service");
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async getFolderTreeData(req) {
        return await this.exportService.getFolderTreeData(req.user.memberId);
    }
    async getExplorerTreeData(req) {
        return await this.exportService.getExplorerTreeData(req.user.memberId);
    }
    async getFolderTreeDataWithIds(req) {
        return await this.exportService.getFolderTreeDataWithIds(req.user.memberId);
    }
    async downloadFile(filename, res) {
        try {
            const filePath = path.join(__dirname, "..", "..", "public", "exports", filename);
            if (!require("fs").existsSync(filePath)) {
                throw new common_1.BadRequestException("File not found");
            }
            const ext = filename.split(".").pop()?.toLowerCase();
            let contentType = "application/octet-stream";
            if (ext === "pdf") {
                contentType = "application/pdf";
            }
            else if (ext === "xlsx" || ext === "xls") {
                contentType =
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
            const fileStream = require("fs").createReadStream(filePath);
            fileStream.pipe(res);
        }
        catch (error) {
            console.error("Download failed:", error);
            throw new common_1.BadRequestException("Download failed: " + error.message);
        }
    }
    async exportFamilyData(exportRequest, req) {
        if (!exportRequest.format || !exportRequest.scope) {
            throw new common_1.BadRequestException("Format and scope are required");
        }
        try {
            const result = await this.exportService.exportFamilyData(req.user.memberId, exportRequest);
            return result;
        }
        catch (error) {
            console.error("Export failed:", error);
            throw new common_1.BadRequestException("Export failed: " + error.message);
        }
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)("folder-tree-data"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "getFolderTreeData", null);
__decorate([
    (0, common_1.Get)("explorer-tree-data"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "getExplorerTreeData", null);
__decorate([
    (0, common_1.Get)("folder-tree-data-with-ids"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "getFolderTreeDataWithIds", null);
__decorate([
    (0, common_1.Get)("download/:filename"),
    __param(0, (0, common_1.Param)("filename")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Post)("family-data"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportFamilyData", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)("export"),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map