"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DataValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataValidatorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let DataValidatorService = DataValidatorService_1 = class DataValidatorService {
    constructor() {
        this.logger = new common_1.Logger(DataValidatorService_1.name);
    }
    validateImportData(data, familyId) {
        const errors = [];
        const warnings = [];
        const validData = [];
        if (this.isFamilyData(data)) {
            const familyData = data;
            familyData.forEach((family, familyIndex) => {
                this.validateFamilyData(family, familyIndex, errors, warnings, validData);
            });
        }
        else {
            const memberData = data;
            memberData.forEach((member, index) => {
                this.validateMemberData(member, index + 1, errors, warnings, validData);
            });
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            validData,
        };
    }
    isFamilyData(data) {
        return data.length > 0 && "members" in data[0];
    }
    validateFamilyData(family, familyIndex, errors, warnings, validData) {
        if (!family.name || family.name.trim().length === 0) {
            errors.push({
                row: familyIndex + 1,
                field: "familyName",
                message: "Family name is required",
            });
        }
        else if (family.name.length > 100) {
            errors.push({
                row: familyIndex + 1,
                field: "familyName",
                message: "Family name must be less than 100 characters",
            });
        }
        if (family.description && family.description.length > 500) {
            warnings.push({
                row: familyIndex + 1,
                field: "familyDescription",
                message: "Family description is quite long, consider shortening it",
            });
        }
        if (!family.members || family.members.length === 0) {
            errors.push({
                row: familyIndex + 1,
                message: "Family must have at least one member",
            });
            return;
        }
        family.members.forEach((member, memberIndex) => {
            this.validateMemberData(member, familyIndex * 1000 + memberIndex + 1, errors, warnings, validData);
        });
    }
    validateMemberData(member, rowNumber, errors, warnings, validData) {
        let isValid = true;
        if (!member.name || member.name.trim().length === 0) {
            errors.push({
                row: rowNumber,
                field: "name",
                message: "Member name is required",
            });
            isValid = false;
        }
        else if (member.name.length > 100) {
            errors.push({
                row: rowNumber,
                field: "name",
                message: "Member name must be less than 100 characters",
            });
            isValid = false;
        }
        if (member.gender && !Object.values(client_1.Gender).includes(member.gender)) {
            errors.push({
                row: rowNumber,
                field: "gender",
                message: `Invalid gender value: ${member.gender}. Must be one of: ${Object.values(client_1.Gender).join(", ")}`,
            });
            isValid = false;
        }
        if (member.status && !Object.values(client_1.MemberStatus).includes(member.status)) {
            errors.push({
                row: rowNumber,
                field: "status",
                message: `Invalid status value: ${member.status}. Must be one of: ${Object.values(client_1.MemberStatus).join(", ")}`,
            });
            isValid = false;
        }
        if (member.color && !this.isValidHexColor(member.color)) {
            errors.push({
                row: rowNumber,
                field: "color",
                message: "Color must be a valid hex color code (e.g., #FF5733)",
            });
            isValid = false;
        }
        if (member.personalInfo) {
            this.validatePersonalInfo(member.personalInfo, rowNumber, errors, warnings);
        }
        if (member.parentNames && member.parentNames.length > 10) {
            warnings.push({
                row: rowNumber,
                field: "parentNames",
                message: "Member has many parents listed, please verify this is correct",
            });
        }
        if (member.spouseNames && member.spouseNames.length > 5) {
            warnings.push({
                row: rowNumber,
                field: "spouseNames",
                message: "Member has many spouses listed, please verify this is correct",
            });
        }
        if (member.familyRole &&
            !["ADMIN", "MEMBER", "HEAD", "VIEWER"].includes(member.familyRole.toUpperCase())) {
            errors.push({
                row: rowNumber,
                field: "familyRole",
                message: `Invalid family role: ${member.familyRole}. Must be one of: ADMIN, MEMBER, HEAD, VIEWER`,
            });
            isValid = false;
        }
        if (member.name) {
            const duplicateCount = validData.filter((m) => m.name.toLowerCase() === member.name.toLowerCase()).length;
            if (duplicateCount > 0) {
                warnings.push({
                    row: rowNumber,
                    field: "name",
                    message: `Duplicate member name found: ${member.name}. This may cause confusion.`,
                });
            }
        }
        if (isValid) {
            validData.push(member);
        }
    }
    validatePersonalInfo(personalInfo, rowNumber, errors, warnings) {
        if (personalInfo.bio && personalInfo.bio.length > 1000) {
            errors.push({
                row: rowNumber,
                field: "bio",
                message: "Biography must be less than 1000 characters",
            });
        }
        if (personalInfo.birthDate) {
            if (!this.isValidDate(personalInfo.birthDate)) {
                errors.push({
                    row: rowNumber,
                    field: "birthDate",
                    message: "Birth date must be a valid date (YYYY-MM-DD format recommended)",
                });
            }
            else {
                const birthDate = new Date(personalInfo.birthDate);
                const now = new Date();
                const age = now.getFullYear() - birthDate.getFullYear();
                if (age > 150) {
                    warnings.push({
                        row: rowNumber,
                        field: "birthDate",
                        message: "Birth date seems unusually old, please verify",
                    });
                }
                else if (age < 0) {
                    errors.push({
                        row: rowNumber,
                        field: "birthDate",
                        message: "Birth date cannot be in the future",
                    });
                }
            }
        }
        if (personalInfo.birthPlace && personalInfo.birthPlace.length > 100) {
            warnings.push({
                row: rowNumber,
                field: "birthPlace",
                message: "Birth place is quite long, consider shortening it",
            });
        }
        if (personalInfo.occupation && personalInfo.occupation.length > 100) {
            warnings.push({
                row: rowNumber,
                field: "occupation",
                message: "Occupation is quite long, consider shortening it",
            });
        }
        if (personalInfo.socialLinks) {
            this.validateSocialLinks(personalInfo.socialLinks, rowNumber, errors, warnings);
        }
    }
    validateSocialLinks(socialLinks, rowNumber, errors, warnings) {
        const urlRegex = /^https?:\/\/.+/i;
        Object.entries(socialLinks).forEach(([platform, url]) => {
            if (typeof url !== "string") {
                errors.push({
                    row: rowNumber,
                    field: `socialLinks.${platform}`,
                    message: `Social link for ${platform} must be a string`,
                });
                return;
            }
            if (url.length > 500) {
                errors.push({
                    row: rowNumber,
                    field: `socialLinks.${platform}`,
                    message: `Social link for ${platform} is too long (max 500 characters)`,
                });
                return;
            }
            if (!urlRegex.test(url)) {
                warnings.push({
                    row: rowNumber,
                    field: `socialLinks.${platform}`,
                    message: `Social link for ${platform} doesn't appear to be a valid URL`,
                });
            }
        });
    }
    isValidHexColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
    isValidDate(dateString) {
        const date = new Date(dateString);
        return (!isNaN(date.getTime()) &&
            date.toISOString().startsWith(dateString.substring(0, 10)));
    }
    validateRelationships(data) {
        const errors = [];
        const warnings = [];
        const memberNames = new Set(data.map((m) => m.name.toLowerCase()));
        data.forEach((member, index) => {
            const rowNumber = index + 1;
            if (member.parentNames) {
                member.parentNames.forEach((parentName) => {
                    if (!memberNames.has(parentName.toLowerCase())) {
                        warnings.push({
                            row: rowNumber,
                            field: "parentNames",
                            message: `Parent "${parentName}" not found in import data. Relationship will be created but parent may not exist.`,
                        });
                    }
                });
            }
            if (member.spouseNames) {
                member.spouseNames.forEach((spouseName) => {
                    if (!memberNames.has(spouseName.toLowerCase())) {
                        warnings.push({
                            row: rowNumber,
                            field: "spouseNames",
                            message: `Spouse "${spouseName}" not found in import data. Relationship will be created but spouse may not exist.`,
                        });
                    }
                });
            }
        });
        return { errors, warnings };
    }
    sanitizeImportData(data) {
        return data.map((member) => ({
            ...member,
            name: member.name?.trim(),
            color: member.color?.trim(),
            familyName: member.familyName?.trim(),
            familyRole: member.familyRole?.trim(),
            parentNames: member.parentNames
                ?.map((name) => name.trim())
                .filter((name) => name.length > 0),
            spouseNames: member.spouseNames
                ?.map((name) => name.trim())
                .filter((name) => name.length > 0),
            personalInfo: member.personalInfo
                ? {
                    ...member.personalInfo,
                    bio: member.personalInfo.bio?.trim(),
                    birthPlace: member.personalInfo.birthPlace?.trim(),
                    occupation: member.personalInfo.occupation?.trim(),
                    socialLinks: member.personalInfo.socialLinks
                        ? Object.fromEntries(Object.entries(member.personalInfo.socialLinks)
                            .map(([key, value]) => [
                            key.trim(),
                            typeof value === "string" ? value.trim() : value,
                        ])
                            .filter(([key]) => key.length > 0))
                        : undefined,
                }
                : undefined,
        }));
    }
};
exports.DataValidatorService = DataValidatorService;
exports.DataValidatorService = DataValidatorService = DataValidatorService_1 = __decorate([
    (0, common_1.Injectable)()
], DataValidatorService);
//# sourceMappingURL=data-validator.service.js.map