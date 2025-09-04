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
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const export_service_1 = require("./export.service");
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async getFolderTreeData(req) {
        return await this.exportService.getFolderTreeData(req.user.memberId);
    }
    async exportFamilyData(exportRequest, req, res) {
        if (!exportRequest.format || !exportRequest.scope) {
            throw new common_1.BadRequestException('Format and scope are required');
        }
        try {
            const exportData = await this.exportService.exportFamilyData(req.user.memberId, exportRequest);
            let contentType;
            let filename;
            let fileExtension;
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
        }
        catch (error) {
            console.error('Export failed:', error);
            throw new common_1.BadRequestException('Export failed: ' + error.message);
        }
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('folder-tree-data'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "getFolderTreeData", null);
__decorate([
    (0, common_1.Post)('family-data'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportFamilyData", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map