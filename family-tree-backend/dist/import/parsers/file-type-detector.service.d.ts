import { FileTypeDetection } from "../interfaces/import.interface";
export declare class FileTypeDetectorService {
    private readonly EXCEL_MIME_TYPES;
    private readonly EXCEL_EXTENSIONS;
    private readonly JSON_EXTENSIONS;
    detectFileType(file: Express.Multer.File): FileTypeDetection;
    private isExcelMimeType;
    private isExcelExtension;
    private isJsonExtension;
    private getFileExtension;
    private calculateConfidence;
    private detectByContent;
    validateFileSecurity(file: Express.Multer.File): {
        isValid: boolean;
        error?: string;
    };
}
