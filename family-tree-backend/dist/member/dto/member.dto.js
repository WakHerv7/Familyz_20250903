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
exports.MemberRelationshipsResponseDto = exports.SimpleMemberDto = exports.MemberResponseDto = exports.FamilyMembershipDto = exports.CreateMemberDto = exports.BulkRelationshipDto = exports.RemoveRelationshipDto = exports.AddRelationshipDto = exports.UpdateMemberProfileDto = exports.RelationshipType = exports.FamilyRole = exports.MemberStatus = exports.Gender = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "Gender", { enumerable: true, get: function () { return client_1.Gender; } });
Object.defineProperty(exports, "MemberStatus", { enumerable: true, get: function () { return client_1.MemberStatus; } });
Object.defineProperty(exports, "FamilyRole", { enumerable: true, get: function () { return client_1.FamilyRole; } });
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["PARENT"] = "PARENT";
    RelationshipType["SPOUSE"] = "SPOUSE";
    RelationshipType["CHILD"] = "CHILD";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
class UpdateMemberProfileDto {
}
exports.UpdateMemberProfileDto = UpdateMemberProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberProfileDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Gender }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Gender),
    __metadata("design:type", String)
], UpdateMemberProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MemberStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberStatus),
    __metadata("design:type", String)
], UpdateMemberProfileDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateMemberProfileDto.prototype, "personalInfo", void 0);
class AddRelationshipDto {
}
exports.AddRelationshipDto = AddRelationshipDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddRelationshipDto.prototype, "relatedMemberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: RelationshipType }),
    (0, class_validator_1.IsEnum)(RelationshipType),
    __metadata("design:type", String)
], AddRelationshipDto.prototype, "relationshipType", void 0);
class RemoveRelationshipDto {
}
exports.RemoveRelationshipDto = RemoveRelationshipDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RemoveRelationshipDto.prototype, "relatedMemberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: RelationshipType }),
    (0, class_validator_1.IsEnum)(RelationshipType),
    __metadata("design:type", String)
], RemoveRelationshipDto.prototype, "relationshipType", void 0);
class BulkRelationshipDto {
}
exports.BulkRelationshipDto = BulkRelationshipDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AddRelationshipDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AddRelationshipDto),
    __metadata("design:type", Array)
], BulkRelationshipDto.prototype, "relationships", void 0);
class CreateMemberDto {
}
exports.CreateMemberDto = CreateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Gender }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Gender),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MemberStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberStatus),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMemberDto.prototype, "personalInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.FamilyRole }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.FamilyRole),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [AddRelationshipDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AddRelationshipDto),
    __metadata("design:type", Array)
], CreateMemberDto.prototype, "initialRelationships", void 0);
class FamilyMembershipDto {
}
exports.FamilyMembershipDto = FamilyMembershipDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMembershipDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMembershipDto.prototype, "familyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMembershipDto.prototype, "familyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.FamilyRole }),
    __metadata("design:type", String)
], FamilyMembershipDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMembershipDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FamilyMembershipDto.prototype, "autoEnrolled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FamilyMembershipDto.prototype, "manuallyEdited", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FamilyMembershipDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], FamilyMembershipDto.prototype, "joinDate", void 0);
class MemberResponseDto {
}
exports.MemberResponseDto = MemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Gender }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MemberStatus }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], MemberResponseDto.prototype, "personalInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MemberResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MemberResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [FamilyMembershipDto] }),
    __metadata("design:type", Array)
], MemberResponseDto.prototype, "familyMemberships", void 0);
class SimpleMemberDto {
}
exports.SimpleMemberDto = SimpleMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SimpleMemberDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SimpleMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SimpleMemberDto.prototype, "gender", void 0);
class MemberRelationshipsResponseDto extends MemberResponseDto {
}
exports.MemberRelationshipsResponseDto = MemberRelationshipsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SimpleMemberDto] }),
    __metadata("design:type", Array)
], MemberRelationshipsResponseDto.prototype, "parents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SimpleMemberDto] }),
    __metadata("design:type", Array)
], MemberRelationshipsResponseDto.prototype, "children", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SimpleMemberDto] }),
    __metadata("design:type", Array)
], MemberRelationshipsResponseDto.prototype, "spouses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FamilyMembershipDto] }),
    __metadata("design:type", Array)
], MemberRelationshipsResponseDto.prototype, "familyMemberships", void 0);
//# sourceMappingURL=member.dto.js.map