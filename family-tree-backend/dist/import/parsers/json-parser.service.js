"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var JsonParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonParserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let JsonParserService = JsonParserService_1 = class JsonParserService {
    constructor() {
        this.logger = new common_1.Logger(JsonParserService_1.name);
    }
    async parseJsonFile(buffer) {
        try {
            const content = buffer.toString("utf8");
            const jsonData = JSON.parse(content);
            return this.parseJsonData(jsonData);
        }
        catch (error) {
            this.logger.error("Failed to parse JSON file", error);
            throw new Error("Invalid JSON file format");
        }
    }
    parseJsonData(jsonData) {
        const errors = [];
        const warnings = [];
        if (Array.isArray(jsonData)) {
            const members = [];
            jsonData.forEach((item, index) => {
                try {
                    const member = this.parseMemberObject(item, index + 1);
                    if (member) {
                        members.push(member);
                    }
                }
                catch (error) {
                    errors.push({
                        row: index + 1,
                        message: `Failed to parse member at index ${index}: ${error.message}`,
                        data: item,
                    });
                }
            });
            return { data: members, errors, warnings };
        }
        else if (jsonData.members) {
            try {
                const family = this.parseFamilyObject(jsonData);
                return { data: [family], errors, warnings };
            }
            catch (error) {
                errors.push({
                    row: 1,
                    message: `Failed to parse family object: ${error.message}`,
                    data: jsonData,
                });
                return { data: [], errors, warnings };
            }
        }
        else {
            try {
                const member = this.parseMemberObject(jsonData, 1);
                return { data: member ? [member] : [], errors, warnings };
            }
            catch (error) {
                errors.push({
                    row: 1,
                    message: `Failed to parse member object: ${error.message}`,
                    data: jsonData,
                });
                return { data: [], errors, warnings };
            }
        }
    }
    parseFamilyObject(familyData) {
        const family = {
            name: familyData.name || "Imported Family",
            description: familyData.description,
            members: [],
        };
        if (Array.isArray(familyData.members)) {
            family.members = familyData.members
                .map((memberData, index) => {
                try {
                    return this.parseMemberObject(memberData, index + 1);
                }
                catch (error) {
                    return null;
                }
            })
                .filter((member) => member !== null);
        }
        return family;
    }
    parseMemberObject(memberData, rowNumber) {
        if (!memberData || typeof memberData !== "object") {
            return null;
        }
        const member = {
            name: memberData.name || memberData.fullName || memberData.full_name || "",
        };
        if (memberData.gender) {
            member.gender = this.parseGender(memberData.gender);
        }
        if (memberData.status) {
            member.status = this.parseStatus(memberData.status);
        }
        if (memberData.color) {
            member.color = memberData.color;
        }
        if (memberData.bio ||
            memberData.birthDate ||
            memberData.birthPlace ||
            memberData.occupation ||
            memberData.socialLinks) {
            member.personalInfo = {};
            if (memberData.bio)
                member.personalInfo.bio = memberData.bio;
            if (memberData.birthDate || memberData.birth_date || memberData.dob) {
                member.personalInfo.birthDate =
                    memberData.birthDate || memberData.birth_date || memberData.dob;
            }
            if (memberData.birthPlace || memberData.birth_place) {
                member.personalInfo.birthPlace =
                    memberData.birthPlace || memberData.birth_place;
            }
            if (memberData.occupation || memberData.job || memberData.profession) {
                member.personalInfo.occupation =
                    memberData.occupation || memberData.job || memberData.profession;
            }
            if (memberData.socialLinks || memberData.social_links) {
                member.personalInfo.socialLinks =
                    memberData.socialLinks || memberData.social_links;
            }
        }
        if (memberData.parentNames ||
            memberData.parents ||
            memberData.parent_names) {
            const parents = memberData.parentNames || memberData.parents || memberData.parent_names;
            member.parentNames = Array.isArray(parents)
                ? parents
                : this.parseNameList(String(parents));
        }
        if (memberData.spouseNames ||
            memberData.spouses ||
            memberData.spouse_names) {
            const spouses = memberData.spouseNames || memberData.spouses || memberData.spouse_names;
            member.spouseNames = Array.isArray(spouses)
                ? spouses
                : this.parseNameList(String(spouses));
        }
        if (memberData.familyName || memberData.family) {
            member.familyName = memberData.familyName || memberData.family;
        }
        if (memberData.familyRole || memberData.role) {
            member.familyRole = memberData.familyRole || memberData.role;
        }
        return member;
    }
    parseGender(value) {
        if (typeof value !== "string")
            return undefined;
        const lowerValue = value.toLowerCase();
        if (["male", "m", "man", "boy"].includes(lowerValue)) {
            return client_1.Gender.MALE;
        }
        if (["female", "f", "woman", "girl"].includes(lowerValue)) {
            return client_1.Gender.FEMALE;
        }
        if (["other", "non-binary", "prefer not to say"].includes(lowerValue)) {
            return client_1.Gender.OTHER;
        }
        return undefined;
    }
    parseStatus(value) {
        if (typeof value !== "string")
            return undefined;
        const lowerValue = value.toLowerCase();
        if (["active", "living", "alive"].includes(lowerValue)) {
            return client_1.MemberStatus.ACTIVE;
        }
        if (["inactive", "deceased", "dead"].includes(lowerValue)) {
            return client_1.MemberStatus.DECEASED;
        }
        if (["archived"].includes(lowerValue)) {
            return client_1.MemberStatus.ARCHIVED;
        }
        return undefined;
    }
    parseNameList(value) {
        return value
            .split(/[;,]/)
            .map((name) => name.trim())
            .filter((name) => name.length > 0);
    }
    async validateJsonStructure(buffer) {
        const errors = [];
        const warnings = [];
        try {
            const content = buffer.toString("utf8");
            const jsonData = JSON.parse(content);
            if (Array.isArray(jsonData)) {
                if (jsonData.length === 0) {
                    warnings.push("JSON array is empty");
                }
                else {
                    const sampleSize = Math.min(5, jsonData.length);
                    for (let i = 0; i < sampleSize; i++) {
                        if (!jsonData[i] || typeof jsonData[i] !== "object") {
                            errors.push(`Invalid member object at index ${i}`);
                        }
                        else if (!jsonData[i].name &&
                            !jsonData[i].fullName &&
                            !jsonData[i].full_name) {
                            errors.push(`Member at index ${i} is missing a name field`);
                        }
                    }
                }
            }
            else if (jsonData.members) {
                if (!jsonData.name) {
                    warnings.push("Family object is missing a name field");
                }
                if (!Array.isArray(jsonData.members)) {
                    errors.push("Family members field must be an array");
                }
                else if (jsonData.members.length === 0) {
                    warnings.push("Family has no members");
                }
            }
            else {
                if (!jsonData.name && !jsonData.fullName && !jsonData.full_name) {
                    errors.push("Member object is missing a name field");
                }
            }
        }
        catch (error) {
            errors.push(`Failed to validate JSON file: ${error.message}`);
            return { isValid: false, errors, warnings };
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    generateJsonTemplate() {
        const template = {
            name: "Family Name (optional)",
            description: "Family description (optional)",
            members: [
                {
                    name: "John Doe",
                    gender: "MALE",
                    status: "ACTIVE",
                    color: "#FF5733",
                    personalInfo: {
                        bio: "Brief biography",
                        birthDate: "1990-01-15",
                        birthPlace: "City, Country",
                        occupation: "Software Engineer",
                        socialLinks: {
                            facebook: "https://facebook.com/johndoe",
                            linkedin: "https://linkedin.com/in/johndoe",
                        },
                    },
                    parentNames: ["Father Name", "Mother Name"],
                    spouseNames: ["Spouse Name"],
                    familyName: "Family Name",
                    familyRole: "MEMBER",
                },
            ],
        };
        return JSON.stringify(template, null, 2);
    }
};
exports.JsonParserService = JsonParserService;
exports.JsonParserService = JsonParserService = JsonParserService_1 = __decorate([
    (0, common_1.Injectable)()
], JsonParserService);
//# sourceMappingURL=json-parser.service.js.map