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
exports.FamilyWithMembersDto = exports.FamilyMemberDto = exports.FamilyResponseDto = exports.AddMemberToFamilyDto = exports.UpdateFamilyMembershipDto = exports.UpdateFamilyDto = exports.CreateFamilyDto = exports.FamilyRole = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "FamilyRole", { enumerable: true, get: function () { return client_1.FamilyRole; } });
class CreateFamilyDto {
}
exports.CreateFamilyDto = CreateFamilyDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFamilyDto.prototype, "isSubFamily", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "parentFamilyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "headOfFamilyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFamilyDto.prototype, "addCreatorAsMember", void 0);
class UpdateFamilyDto {
}
exports.UpdateFamilyDto = UpdateFamilyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFamilyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFamilyDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateFamilyDto.prototype, "headOfFamilyId", void 0);
class UpdateFamilyMembershipDto {
}
exports.UpdateFamilyMembershipDto = UpdateFamilyMembershipDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.FamilyRole }),
    (0, class_validator_1.IsEnum)(client_1.FamilyRole),
    __metadata("design:type", String)
], UpdateFamilyMembershipDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFamilyMembershipDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFamilyMembershipDto.prototype, "manuallyEdited", void 0);
class AddMemberToFamilyDto {
}
exports.AddMemberToFamilyDto = AddMemberToFamilyDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddMemberToFamilyDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.FamilyRole }),
    (0, class_validator_1.IsEnum)(client_1.FamilyRole),
    __metadata("design:type", String)
], AddMemberToFamilyDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddMemberToFamilyDto.prototype, "type", void 0);
class FamilyResponseDto {
}
exports.FamilyResponseDto = FamilyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FamilyResponseDto.prototype, "isSubFamily", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "creatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "headOfFamilyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FamilyResponseDto.prototype, "parentFamilyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], FamilyResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], FamilyResponseDto.prototype, "updatedAt", void 0);
class FamilyMemberDto {
}
exports.FamilyMemberDto = FamilyMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMemberDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FamilyMemberDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FamilyMemberDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], FamilyMemberDto.prototype, "joinDate", void 0);
class FamilyWithMembersDto extends FamilyResponseDto {
}
exports.FamilyWithMembersDto = FamilyWithMembersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FamilyMemberDto] }),
    __metadata("design:type", Array)
], FamilyWithMembersDto.prototype, "members", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FamilyResponseDto] }),
    __metadata("design:type", Array)
], FamilyWithMembersDto.prototype, "subFamilies", void 0);
//# sourceMappingURL=family.dto.js.map