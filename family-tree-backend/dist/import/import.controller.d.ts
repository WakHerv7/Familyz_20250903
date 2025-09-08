import { Response } from "express";
import { ImportService } from "./import.service";
import { TemplateService } from "./template.service";
import { StartImportDto, ValidateImportDto } from "./dto/import.dto";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ImportProgress } from "./interfaces/import.interface";
export declare class ImportController {
    private readonly importService;
    private readonly templateService;
    constructor(importService: ImportService, templateService: TemplateService);
    validateFile(file: Express.Multer.File, body: ValidateImportDto): Promise<{
        success: boolean;
        fileType: "json" | "excel" | "unknown";
        errors: string[];
        warnings: string[];
    }>;
    startImport(user: AuthenticatedUser, file: Express.Multer.File, body: StartImportDto): Promise<{
        success: boolean;
        importId: string;
        message: string;
    }>;
    getImportProgress(importId: string): Promise<{
        success: boolean;
        message: string;
        progress?: undefined;
    } | {
        success: boolean;
        progress: ImportProgress;
        message?: undefined;
    }>;
    rollbackImport(importId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    downloadJsonTemplate(sampleData?: string, size?: string): Promise<{
        success: boolean;
        template: string;
        instructions: string;
    }>;
    downloadExcelTemplate(response: Response, sampleData?: string, size?: string): Promise<void>;
}
