import { PrismaService } from "../prisma/prisma.service";
import { FileTypeDetectorService } from "./parsers/file-type-detector.service";
import { ExcelParserService } from "./parsers/excel-parser.service";
import { JsonParserService } from "./parsers/json-parser.service";
import { DataValidatorService } from "./validators/data-validator.service";
import { ImportProgress } from "./interfaces/import.interface";
export declare class ImportService {
    private readonly prisma;
    private readonly fileTypeDetector;
    private readonly excelParser;
    private readonly jsonParser;
    private readonly dataValidator;
    private readonly logger;
    private readonly activeImports;
    constructor(prisma: PrismaService, fileTypeDetector: FileTypeDetectorService, excelParser: ExcelParserService, jsonParser: JsonParserService, dataValidator: DataValidatorService);
    validateFile(file: Express.Multer.File): Promise<{
        isValid: boolean;
        fileType: "excel" | "json" | "unknown";
        errors: string[];
        warnings: string[];
    }>;
    startImport(file: Express.Multer.File, userId: string, familyId?: string, importName?: string): Promise<string>;
    private processImport;
    private performImport;
    private createRelationships;
    private mapFamilyRole;
    getImportProgress(importId: string): Promise<ImportProgress | null>;
    rollbackImport(importId: string): Promise<boolean>;
    private updateProgress;
    cleanupOldImports(): void;
}
