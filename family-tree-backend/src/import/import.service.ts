import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FileTypeDetectorService } from "./parsers/file-type-detector.service";
import { ExcelParserService } from "./parsers/excel-parser.service";
import { JsonParserService } from "./parsers/json-parser.service";
import { DataValidatorService } from "./validators/data-validator.service";
import {
  ImportResult,
  ImportMemberData,
  ImportFamilyData,
  ImportProgress,
  ImportBatch,
} from "./interfaces/import.interface";
import {
  Gender,
  MemberStatus,
  FamilyRole,
  MembershipType,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly activeImports = new Map<string, ImportProgress>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileTypeDetector: FileTypeDetectorService,
    private readonly excelParser: ExcelParserService,
    private readonly jsonParser: JsonParserService,
    private readonly dataValidator: DataValidatorService
  ) {}

  async validateFile(file: Express.Multer.File): Promise<{
    isValid: boolean;
    fileType: "excel" | "json" | "unknown";
    errors: string[];
    warnings: string[];
  }> {
    // Check file security
    const securityCheck = this.fileTypeDetector.validateFileSecurity(file);
    if (!securityCheck.isValid) {
      return {
        isValid: false,
        fileType: "unknown",
        errors: [securityCheck.error!],
        warnings: [],
      };
    }

    // Detect file type
    const fileTypeDetection = this.fileTypeDetector.detectFileType(file);
    if (
      fileTypeDetection.type === "unknown" ||
      fileTypeDetection.confidence < 0.5
    ) {
      return {
        isValid: false,
        fileType: "unknown",
        errors: ["Unable to determine file type or file type not supported"],
        warnings: [],
      };
    }

    // Validate file structure
    let structureValidation;
    try {
      if (fileTypeDetection.type === "excel") {
        structureValidation = await this.excelParser.validateExcelStructure(
          file.buffer
        );
      } else {
        structureValidation = await this.jsonParser.validateJsonStructure(
          file.buffer
        );
      }
    } catch (error) {
      return {
        isValid: false,
        fileType: fileTypeDetection.type as "excel" | "json",
        errors: [`Failed to validate file structure: ${error.message}`],
        warnings: [],
      };
    }

    return {
      isValid: structureValidation.isValid,
      fileType: fileTypeDetection.type as "excel" | "json",
      errors: structureValidation.errors,
      warnings: structureValidation.warnings || [],
    };
  }

  async startImport(
    file: Express.Multer.File,
    userId: string,
    familyId?: string,
    importName?: string
  ): Promise<string> {
    const importId = uuidv4();

    // Initialize import progress
    const progress: ImportProgress = {
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

    // Start import process asynchronously
    this.processImport(importId, file, userId, familyId, importName).catch(
      (error) => {
        this.logger.error(`Import ${importId} failed`, error);
        progress.status = "failed";
        progress.errors.push({
          row: 0,
          message: `Import failed: ${error.message}`,
        });
      }
    );

    return importId;
  }

  private async processImport(
    importId: string,
    file: Express.Multer.File,
    userId: string,
    familyId?: string,
    importName?: string
  ): Promise<void> {
    const progress = this.activeImports.get(importId);
    if (!progress) return;

    try {
      // Step 1: Parse file
      progress.currentStep = "Parsing file";
      progress.progress = 10;
      this.updateProgress(importId, progress);

      const fileTypeDetection = this.fileTypeDetector.detectFileType(file);
      let parseResult;

      if (fileTypeDetection.type === "excel") {
        parseResult = await this.excelParser.parseExcelFile(file.buffer);
      } else if (fileTypeDetection.type === "json") {
        parseResult = await this.jsonParser.parseJsonFile(file.buffer);
      } else {
        throw new Error("Unsupported file type");
      }

      if (parseResult.errors.length > 0) {
        progress.status = "failed";
        progress.errors = parseResult.errors;
        this.updateProgress(importId, progress);
        return;
      }

      progress.totalRecords = parseResult.data.length;

      // Step 2: Validate data
      progress.currentStep = "Validating data";
      progress.progress = 30;
      this.updateProgress(importId, progress);

      const validationResult = this.dataValidator.validateImportData(
        parseResult.data,
        familyId
      );

      if (!validationResult.isValid) {
        progress.status = "failed";
        progress.errors = validationResult.errors;
        this.updateProgress(importId, progress);
        return;
      }

      // Sanitize data
      const sanitizedData = this.dataValidator.sanitizeImportData(
        validationResult.validData
      );

      // Step 3: Import data with transaction
      progress.currentStep = "Importing data";
      progress.progress = 50;
      this.updateProgress(importId, progress);

      const importResult = await this.performImport(
        sanitizedData,
        userId,
        familyId,
        importName
      );

      // Step 4: Complete
      progress.status = "completed";
      progress.progress = 100;
      progress.processedRecords = importResult.successfulImports;
      progress.endTime = new Date();
      this.updateProgress(importId, progress);
    } catch (error) {
      progress.status = "failed";
      progress.errors.push({
        row: 0,
        message: `Import processing failed: ${error.message}`,
      });
      this.updateProgress(importId, progress);
      throw error;
    }
  }

  private async performImport(
    data: ImportMemberData[],
    userId: string,
    familyId?: string,
    importName?: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRecords: data.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      warnings: [],
      importId: uuidv4(),
    };

    // Use transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      const memberMap = new Map<string, string>(); // name -> memberId
      const createdMembers: string[] = [];

      try {
        // Create members
        for (let i = 0; i < data.length; i++) {
          const memberData = data[i];

          try {
            const member = await tx.member.create({
              data: {
                name: memberData.name,
                gender: memberData.gender,
                status: memberData.status || MemberStatus.ACTIVE,
                personalInfo: memberData.personalInfo
                  ? JSON.stringify(memberData.personalInfo)
                  : null,
                color: memberData.color,
              },
            });

            memberMap.set(memberData.name.toLowerCase(), member.id);
            createdMembers.push(member.id);
            result.successfulImports++;
          } catch (error) {
            result.failedImports++;
            result.errors.push({
              row: i + 1,
              message: `Failed to create member ${memberData.name}: ${error.message}`,
              data: memberData,
            });
          }
        }

        // Create family if specified or if members have family info
        let targetFamilyId = familyId;
        if (!targetFamilyId && data.some((m) => m.familyName)) {
          const familyName =
            data.find((m) => m.familyName)?.familyName || "Imported Family";
          const family = await tx.family.create({
            data: {
              name: familyName,
              creatorId: userId,
            },
          });
          targetFamilyId = family.id;
        }

        // Create family memberships if family exists
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
                    type: MembershipType.MAIN,
                  },
                });
              } catch (error) {
                result.warnings.push({
                  row: data.indexOf(memberData) + 1,
                  message: `Failed to create family membership for ${memberData.name}: ${error.message}`,
                });
              }
            }
          }
        }

        // Create relationships
        await this.createRelationships(data, memberMap, tx, result);

        result.success = result.failedImports === 0;
      } catch (error) {
        // Transaction will be rolled back automatically
        throw error;
      }
    });

    return result;
  }

  private async createRelationships(
    data: ImportMemberData[],
    memberMap: Map<string, string>,
    tx: any,
    result: ImportResult
  ): Promise<void> {
    for (const memberData of data) {
      const memberId = memberMap.get(memberData.name.toLowerCase());
      if (!memberId) continue;

      // Create parent-child relationships
      if (memberData.parentNames) {
        for (const parentName of memberData.parentNames) {
          const parentId = memberMap.get(parentName.toLowerCase());
          if (parentId) {
            try {
              // Add parent to child's parents array
              await tx.member.update({
                where: { id: memberId },
                data: {
                  parents: {
                    connect: { id: parentId },
                  },
                },
              });
            } catch (error) {
              result.warnings.push({
                row: data.indexOf(memberData) + 1,
                message: `Failed to create parent-child relationship: ${error.message}`,
              });
            }
          }
        }
      }

      // Create spouse relationships
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
            } catch (error) {
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

  private mapFamilyRole(role?: string): FamilyRole {
    if (!role) return FamilyRole.MEMBER;

    switch (role.toUpperCase()) {
      case "ADMIN":
        return FamilyRole.ADMIN;
      case "HEAD":
        return FamilyRole.HEAD;
      case "VIEWER":
        return FamilyRole.VIEWER;
      default:
        return FamilyRole.MEMBER;
    }
  }

  async getImportProgress(importId: string): Promise<ImportProgress | null> {
    return this.activeImports.get(importId) || null;
  }

  async rollbackImport(importId: string): Promise<boolean> {
    const progress = this.activeImports.get(importId);
    if (!progress || progress.status !== "completed") {
      return false;
    }

    try {
      // Note: In a real implementation, you'd need to track what was created
      // and implement proper rollback logic. For now, this is a placeholder.
      progress.status = "rolled_back";
      this.updateProgress(importId, progress);
      return true;
    } catch (error) {
      this.logger.error(`Failed to rollback import ${importId}`, error);
      return false;
    }
  }

  private updateProgress(importId: string, progress: ImportProgress): void {
    this.activeImports.set(importId, { ...progress });
  }

  // Clean up old completed imports (call this periodically)
  cleanupOldImports(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Keep for 24 hours

    for (const [importId, progress] of this.activeImports.entries()) {
      if (progress.endTime && progress.endTime < cutoffTime) {
        this.activeImports.delete(importId);
      }
    }
  }
}
