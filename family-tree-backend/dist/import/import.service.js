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
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const file_type_detector_service_1 = require("./parsers/file-type-detector.service");
const excel_parser_service_1 = require("./parsers/excel-parser.service");
const json_parser_service_1 = require("./parsers/json-parser.service");
const data_validator_service_1 = require("./validators/data-validator.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
let ImportService = ImportService_1 = class ImportService {
    constructor(prisma, fileTypeDetector, excelParser, jsonParser, dataValidator) {
        this.prisma = prisma;
        this.fileTypeDetector = fileTypeDetector;
        this.excelParser = excelParser;
        this.jsonParser = jsonParser;
        this.dataValidator = dataValidator;
        this.logger = new common_1.Logger(ImportService_1.name);
        this.activeImports = new Map();
    }
    async validateFile(file) {
        const securityCheck = this.fileTypeDetector.validateFileSecurity(file);
        if (!securityCheck.isValid) {
            return {
                isValid: false,
                fileType: "unknown",
                errors: [securityCheck.error],
                warnings: [],
            };
        }
        const fileTypeDetection = this.fileTypeDetector.detectFileType(file);
        if (fileTypeDetection.type === "unknown" ||
            fileTypeDetection.confidence < 0.5) {
            return {
                isValid: false,
                fileType: "unknown",
                errors: ["Unable to determine file type or file type not supported"],
                warnings: [],
            };
        }
        let structureValidation;
        try {
            if (fileTypeDetection.type === "excel") {
                structureValidation = await this.excelParser.validateExcelStructure(file.buffer);
            }
            else {
                structureValidation = await this.jsonParser.validateJsonStructure(file.buffer);
            }
        }
        catch (error) {
            return {
                isValid: false,
                fileType: fileTypeDetection.type,
                errors: [`Failed to validate file structure: ${error.message}`],
                warnings: [],
            };
        }
        return {
            isValid: structureValidation.isValid,
            fileType: fileTypeDetection.type,
            errors: structureValidation.errors,
            warnings: structureValidation.warnings || [],
        };
    }
    async startImport(file, userId, familyId, importName) {
        const importId = (0, uuid_1.v4)();
        const progress = {
            importId,
            status: "pending",
            progress: 0,
            currentStep: "Initializing import",
            totalRecords: 0,
            processedRecords: 0,
            errors: [],
            startTime: new Date(),
        };
        this.activeImports.set(importId, progress);
        this.processImport(importId, file, userId, familyId, importName).catch((error) => {
            this.logger.error(`Import ${importId} failed`, error);
            progress.status = "failed";
            progress.errors.push({
                row: 0,
                message: `Import failed: ${error.message}`,
            });
        });
        return importId;
    }
    async processImport(importId, file, userId, familyId, importName) {
        const progress = this.activeImports.get(importId);
        if (!progress)
            return;
        try {
            progress.currentStep = "Parsing file";
            progress.progress = 10;
            this.updateProgress(importId, progress);
            const fileTypeDetection = this.fileTypeDetector.detectFileType(file);
            let parseResult;
            if (fileTypeDetection.type === "excel") {
                parseResult = await this.excelParser.parseExcelFile(file.buffer);
            }
            else if (fileTypeDetection.type === "json") {
                parseResult = await this.jsonParser.parseJsonFile(file.buffer);
            }
            else {
                throw new Error("Unsupported file type");
            }
            if (parseResult.errors.length > 0) {
                progress.status = "failed";
                progress.errors = parseResult.errors;
                this.updateProgress(importId, progress);
                return;
            }
            progress.totalRecords = parseResult.data.length;
            progress.currentStep = "Validating data";
            progress.progress = 30;
            this.updateProgress(importId, progress);
            const validationResult = this.dataValidator.validateImportData(parseResult.data, familyId);
            if (!validationResult.isValid) {
                progress.status = "failed";
                progress.errors = validationResult.errors;
                this.updateProgress(importId, progress);
                return;
            }
            const sanitizedData = this.dataValidator.sanitizeImportData(validationResult.validData);
            progress.currentStep = "Importing data";
            progress.progress = 50;
            this.updateProgress(importId, progress);
            const importResult = await this.performImport(sanitizedData, userId, familyId, importName);
            progress.status = "completed";
            progress.progress = 100;
            progress.processedRecords = importResult.successfulImports;
            progress.endTime = new Date();
            this.updateProgress(importId, progress);
        }
        catch (error) {
            progress.status = "failed";
            progress.errors.push({
                row: 0,
                message: `Import processing failed: ${error.message}`,
            });
            this.updateProgress(importId, progress);
            throw error;
        }
    }
    async performImport(data, userId, familyId, importName) {
        const result = {
            success: false,
            totalRecords: data.length,
            successfulImports: 0,
            failedImports: 0,
            errors: [],
            warnings: [],
            importId: (0, uuid_1.v4)(),
        };
        await this.prisma.$transaction(async (tx) => {
            const memberMap = new Map();
            const createdMembers = [];
            try {
                for (let i = 0; i < data.length; i++) {
                    const memberData = data[i];
                    try {
                        const member = await tx.member.create({
                            data: {
                                name: memberData.name,
                                gender: memberData.gender,
                                status: memberData.status || client_1.MemberStatus.ACTIVE,
                                personalInfo: memberData.personalInfo
                                    ? JSON.stringify(memberData.personalInfo)
                                    : null,
                                color: memberData.color,
                            },
                        });
                        memberMap.set(memberData.name.toLowerCase(), member.id);
                        createdMembers.push(member.id);
                        result.successfulImports++;
                    }
                    catch (error) {
                        result.failedImports++;
                        result.errors.push({
                            row: i + 1,
                            message: `Failed to create member ${memberData.name}: ${error.message}`,
                            data: memberData,
                        });
                    }
                }
                let targetFamilyId = familyId;
                if (!targetFamilyId && data.some((m) => m.familyName)) {
                    const familyName = data.find((m) => m.familyName)?.familyName || "Imported Family";
                    const family = await tx.family.create({
                        data: {
                            name: familyName,
                            creatorId: userId,
                        },
                    });
                    targetFamilyId = family.id;
                }
                if (targetFamilyId) {
                    for (const memberData of data) {
                        const memberId = memberMap.get(memberData.name.toLowerCase());
                        if (memberId) {
                            try {
                                await tx.familyMembership.create({
                                    data: {
                                        memberId,
                                        familyId: targetFamilyId,
                                        role: this.mapFamilyRole(memberData.familyRole),
                                        type: client_1.MembershipType.MAIN,
                                    },
                                });
                            }
                            catch (error) {
                                result.warnings.push({
                                    row: data.indexOf(memberData) + 1,
                                    message: `Failed to create family membership for ${memberData.name}: ${error.message}`,
                                });
                            }
                        }
                    }
                }
                await this.createRelationships(data, memberMap, tx, result);
                result.success = result.failedImports === 0;
            }
            catch (error) {
                throw error;
            }
        });
        return result;
    }
    async createRelationships(data, memberMap, tx, result) {
        for (const memberData of data) {
            const memberId = memberMap.get(memberData.name.toLowerCase());
            if (!memberId)
                continue;
            if (memberData.parentNames) {
                for (const parentName of memberData.parentNames) {
                    const parentId = memberMap.get(parentName.toLowerCase());
                    if (parentId) {
                        try {
                            await tx.member.update({
                                where: { id: memberId },
                                data: {
                                    parents: {
                                        connect: { id: parentId },
                                    },
                                },
                            });
                        }
                        catch (error) {
                            result.warnings.push({
                                row: data.indexOf(memberData) + 1,
                                message: `Failed to create parent-child relationship: ${error.message}`,
                            });
                        }
                    }
                }
            }
            if (memberData.spouseNames) {
                for (const spouseName of memberData.spouseNames) {
                    const spouseId = memberMap.get(spouseName.toLowerCase());
                    if (spouseId) {
                        try {
                            await tx.member.update({
                                where: { id: memberId },
                                data: {
                                    spouses: {
                                        connect: { id: spouseId },
                                    },
                                },
                            });
                        }
                        catch (error) {
                            result.warnings.push({
                                row: data.indexOf(memberData) + 1,
                                message: `Failed to create spouse relationship: ${error.message}`,
                            });
                        }
                    }
                }
            }
        }
    }
    mapFamilyRole(role) {
        if (!role)
            return client_1.FamilyRole.MEMBER;
        switch (role.toUpperCase()) {
            case "ADMIN":
                return client_1.FamilyRole.ADMIN;
            case "HEAD":
                return client_1.FamilyRole.HEAD;
            case "VIEWER":
                return client_1.FamilyRole.VIEWER;
            default:
                return client_1.FamilyRole.MEMBER;
        }
    }
    async getImportProgress(importId) {
        return this.activeImports.get(importId) || null;
    }
    async rollbackImport(importId) {
        const progress = this.activeImports.get(importId);
        if (!progress || progress.status !== "completed") {
            return false;
        }
        try {
            progress.status = "rolled_back";
            this.updateProgress(importId, progress);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to rollback import ${importId}`, error);
            return false;
        }
    }
    updateProgress(importId, progress) {
        this.activeImports.set(importId, { ...progress });
    }
    cleanupOldImports() {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        for (const [importId, progress] of this.activeImports.entries()) {
            if (progress.endTime && progress.endTime < cutoffTime) {
                this.activeImports.delete(importId);
            }
        }
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        file_type_detector_service_1.FileTypeDetectorService,
        excel_parser_service_1.ExcelParserService,
        json_parser_service_1.JsonParserService,
        data_validator_service_1.DataValidatorService])
], ImportService);
//# sourceMappingURL=import.service.js.map