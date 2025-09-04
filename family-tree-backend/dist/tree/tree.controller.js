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
exports.TreeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tree_service_1 = require("./tree.service");
const tree_dto_1 = require("./dto/tree.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TreeController = class TreeController {
    constructor(treeService) {
        this.treeService = treeService;
    }
    async getFamilyTree(user, familyId, centerMemberId) {
        return this.treeService.getFamilyTree(user, familyId, centerMemberId);
    }
    async getTreeStatistics(user, familyId) {
        return this.treeService.getTreeStatistics(user, familyId);
    }
    async exportFamilyTree(user, exportDto, res) {
        const exportData = await this.treeService.exportFamilyTree(user, exportDto);
        let contentType;
        let filename;
        switch (exportDto.format) {
            case tree_dto_1.TreeFormat.JSON:
                contentType = 'application/json';
                filename = `family-tree-${exportDto.familyId}.json`;
                break;
            case tree_dto_1.TreeFormat.CSV:
                contentType = 'text/csv';
                filename = `family-tree-${exportDto.familyId}.csv`;
                break;
            case tree_dto_1.TreeFormat.PDF:
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
        }
        else {
            res.send(exportData);
        }
    }
    async getMemberRelationships(user, familyId, memberId) {
        return {
            member: { id: memberId },
            directRelationships: [],
            indirectRelationships: [],
            relationshipPath: [],
        };
    }
    async getGenerationBreakdown(user, familyId) {
        const treeData = await this.treeService.getFamilyTree(user, familyId);
        const generations = {};
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
};
exports.TreeController = TreeController;
__decorate([
    (0, common_1.Get)(':familyId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get family tree',
        description: 'Get the complete family tree structure for visualization',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'centerMemberId',
        required: false,
        description: 'ID of the member to center the tree around',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Family tree retrieved successfully',
        type: tree_dto_1.FamilyTreeDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied to this family',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Family not found',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('familyId')),
    __param(2, (0, common_1.Query)('centerMemberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TreeController.prototype, "getFamilyTree", null);
__decorate([
    (0, common_1.Get)(':familyId/statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get family tree statistics',
        description: 'Get statistical information about the family tree',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tree statistics retrieved successfully',
        type: tree_dto_1.TreeStatisticsDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied to this family',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('familyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TreeController.prototype, "getTreeStatistics", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export family tree',
        description: 'Export family tree data in various formats (JSON, CSV, PDF)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tree exported successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied to this family',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tree_dto_1.ExportTreeDto, Object]),
    __metadata("design:returntype", Promise)
], TreeController.prototype, "exportFamilyTree", null);
__decorate([
    (0, common_1.Get)(':familyId/relationships/:memberId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get member relationships',
        description: 'Get detailed relationship information for a specific member',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member relationships retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Access denied to this member',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('familyId')),
    __param(2, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TreeController.prototype, "getMemberRelationships", null);
__decorate([
    (0, common_1.Get)(':familyId/generations'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get generation breakdown',
        description: 'Get members organized by generation levels',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Generation breakdown retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('familyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TreeController.prototype, "getGenerationBreakdown", null);
exports.TreeController = TreeController = __decorate([
    (0, swagger_1.ApiTags)('Family Tree'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tree'),
    __metadata("design:paramtypes", [tree_service_1.TreeService])
], TreeController);
//# sourceMappingURL=tree.controller.js.map