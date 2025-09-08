"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExcelParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelParserService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
const client_1 = require("@prisma/client");
let ExcelParserService = ExcelParserService_1 = class ExcelParserService {
    constructor() {
        this.logger = new common_1.Logger(ExcelParserService_1.name);
    }
    async parseExcelFile(buffer) {
        const workbook = new ExcelJS.Workbook();
        try {
            const bufferData = Buffer.isBuffer(buffer)
                ? buffer
                : Buffer.from(buffer);
            await workbook.xlsx.load(bufferData);
        }
        catch (error) {
            this.logger.error("Failed to load Excel file", error);
            throw new Error("Invalid Excel file format");
        }
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error("No worksheets found in Excel file");
        }
        return this.parseWorksheet(worksheet);
    }
    parseWorksheet(worksheet) {
        const data = [];
        const errors = [];
        const warnings = [];
        const headerRow = worksheet.getRow(1);
        const headers = this.extractHeaders(headerRow);
        if (headers.length === 0) {
            errors.push({
                row: 1,
                message: "No headers found in Excel file",
            });
            return { data, errors, warnings };
        }
        const requiredHeaders = ["name"];
        const missingHeaders = requiredHeaders.filter((header) => !headers.some((h) => h.toLowerCase() === header.toLowerCase()));
        if (missingHeaders.length > 0) {
            errors.push({
                row: 1,
                message: `Missing required headers: ${missingHeaders.join(", ")}`,
            });
            return { data, errors, warnings };
        }
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rowData = this.parseRow(row, headers, rowNumber);
            if (rowData) {
                data.push(rowData);
            }
        });
        return { data, errors, warnings };
    }
    extractHeaders(headerRow) {
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
            const value = cell.value?.toString().trim();
            if (value) {
                headers.push(value);
            }
        });
        return headers;
    }
    parseRow(row, headers, rowNumber) {
        const memberData = {
            name: "",
        };
        let hasData = false;
        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (!header)
                return;
            const value = this.getCellValue(cell);
            if (value !== null && value !== undefined && value !== "") {
                hasData = true;
                this.mapHeaderToField(memberData, header.toLowerCase(), value, rowNumber);
            }
        });
        return hasData ? memberData : null;
    }
    getCellValue(cell) {
        if (cell.value === null || cell.value === undefined) {
            return null;
        }
        if (typeof cell.value === "object") {
            if ("text" in cell.value) {
                return cell.value.text;
            }
            if ("result" in cell.value) {
                return cell.value.result;
            }
        }
        return cell.value;
    }
    mapHeaderToField(memberData, header, value, rowNumber) {
        const stringValue = String(value).trim();
        switch (header) {
            case "name":
            case "full_name":
            case "fullname":
                memberData.name = stringValue;
                break;
            case "gender":
            case "sex":
                memberData.gender = this.parseGender(stringValue);
                break;
            case "status":
                memberData.status = this.parseStatus(stringValue);
                break;
            case "color":
            case "member_color":
                memberData.color = stringValue;
                break;
            case "bio":
            case "biography":
                if (!memberData.personalInfo)
                    memberData.personalInfo = {};
                memberData.personalInfo.bio = stringValue;
                break;
            case "birth_date":
            case "birthdate":
            case "date_of_birth":
            case "dob":
                if (!memberData.personalInfo)
                    memberData.personalInfo = {};
                memberData.personalInfo.birthDate = stringValue;
                break;
            case "birth_place":
            case "birthplace":
            case "place_of_birth":
                if (!memberData.personalInfo)
                    memberData.personalInfo = {};
                memberData.personalInfo.birthPlace = stringValue;
                break;
            case "occupation":
            case "job":
            case "profession":
                if (!memberData.personalInfo)
                    memberData.personalInfo = {};
                memberData.personalInfo.occupation = stringValue;
                break;
            case "parent_names":
            case "parents":
                memberData.parentNames = this.parseNameList(stringValue);
                break;
            case "spouse_names":
            case "spouses":
                memberData.spouseNames = this.parseNameList(stringValue);
                break;
            case "family_name":
            case "family":
                memberData.familyName = stringValue;
                break;
            case "family_role":
            case "role":
                memberData.familyRole = stringValue;
                break;
            default:
                if (header.includes("social") ||
                    header.includes("link") ||
                    ["facebook", "twitter", "instagram", "linkedin", "website"].includes(header)) {
                    if (!memberData.personalInfo)
                        memberData.personalInfo = {};
                    if (!memberData.personalInfo.socialLinks)
                        memberData.personalInfo.socialLinks = {};
                    memberData.personalInfo.socialLinks[header] = stringValue;
                }
                break;
        }
    }
    parseGender(value) {
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
    async validateExcelStructure(buffer) {
        const errors = [];
        const warnings = [];
        try {
            const workbook = new ExcelJS.Workbook();
            const bufferData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
            await workbook.xlsx.load(bufferData);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                errors.push("No worksheets found in the Excel file");
                return { isValid: false, errors, warnings };
            }
            const rowCount = worksheet.rowCount;
            if (rowCount < 2) {
                errors.push("Excel file must contain at least a header row and one data row");
                return { isValid: false, errors, warnings };
            }
            const headerRow = worksheet.getRow(1);
            const headers = this.extractHeaders(headerRow);
            if (headers.length === 0) {
                errors.push("No column headers found in the first row");
                return { isValid: false, errors, warnings };
            }
            const hasNameColumn = headers.some((h) => ["name", "full_name", "fullname"].includes(h.toLowerCase()));
            if (!hasNameColumn) {
                errors.push('Excel file must contain a "name" column');
                return { isValid: false, errors, warnings };
            }
            let dataRowCount = 0;
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    const hasData = Array.from(row.values).some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "");
                    if (hasData)
                        dataRowCount++;
                }
            });
            if (dataRowCount === 0) {
                warnings.push("No data rows found in the Excel file");
            }
        }
        catch (error) {
            errors.push(`Failed to validate Excel file: ${error.message}`);
            return { isValid: false, errors, warnings };
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
};
exports.ExcelParserService = ExcelParserService;
exports.ExcelParserService = ExcelParserService = ExcelParserService_1 = __decorate([
    (0, common_1.Injectable)()
], ExcelParserService);
//# sourceMappingURL=excel-parser.service.js.map