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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeStatisticsDto = exports.ExportTreeDto = exports.FamilyTreeDto = exports.TreeConnectionDto = exports.TreeNodeDto = exports.TreeFormat = exports.MemberStatus = exports.Gender = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "Gender", { enumerable: true, get: function () { return client_1.Gender; } });
Object.defineProperty(exports, "MemberStatus", { enumerable: true, get: function () { return client_1.MemberStatus; } });
var TreeFormat;
(function (TreeFormat) {
    TreeFormat["JSON"] = "json";
    TreeFormat["CSV"] = "csv";
    TreeFormat["PDF"] = "pdf";
})(TreeFormat || (exports.TreeFormat = TreeFormat = {}));
class TreeNodeDto {
}
exports.TreeNodeDto = TreeNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TreeNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TreeNodeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Gender }),
    __metadata("design:type", String)
], TreeNodeDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MemberStatus }),
    __metadata("design:type", String)
], TreeNodeDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], TreeNodeDto.prototype, "personalInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeNodeDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeNodeDto.prototype, "x", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeNodeDto.prototype, "y", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], TreeNodeDto.prototype, "parentIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], TreeNodeDto.prototype, "childrenIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], TreeNodeDto.prototype, "spouseIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TreeNodeDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TreeNodeDto.prototype, "updatedAt", void 0);
class TreeConnectionDto {
}
exports.TreeConnectionDto = TreeConnectionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TreeConnectionDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TreeConnectionDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TreeConnectionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeConnectionDto.prototype, "strength", void 0);
class FamilyTreeDto {
}
exports.FamilyTreeDto = FamilyTreeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TreeNodeDto] }),
    __metadata("design:type", Array)
], FamilyTreeDto.prototype, "nodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TreeConnectionDto] }),
    __metadata("design:type", Array)
], FamilyTreeDto.prototype, "connections", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyTreeDto.prototype, "centerNodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyTreeDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyTreeDto.prototype, "familyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FamilyTreeDto.prototype, "totalMembers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], FamilyTreeDto.prototype, "generations", void 0);
class ExportTreeDto {
}
exports.ExportTreeDto = ExportTreeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ExportTreeDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TreeFormat }),
    (0, class_validator_1.IsEnum)(TreeFormat),
    __metadata("design:type", String)
], ExportTreeDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportTreeDto.prototype, "includePersonalInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportTreeDto.prototype, "includeInactiveMembers", void 0);
class TreeStatisticsDto {
}
exports.TreeStatisticsDto = TreeStatisticsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeStatisticsDto.prototype, "totalMembers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeStatisticsDto.prototype, "totalFamilies", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeStatisticsDto.prototype, "totalGenerations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TreeStatisticsDto.prototype, "averageChildrenPerMember", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TreeStatisticsDto.prototype, "oldestMember", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TreeStatisticsDto.prototype, "youngestMember", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TreeStatisticsDto.prototype, "genderDistribution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TreeStatisticsDto.prototype, "statusDistribution", void 0);
//# sourceMappingURL=tree.dto.js.map