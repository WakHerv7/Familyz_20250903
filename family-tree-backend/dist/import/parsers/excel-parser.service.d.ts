import { ImportMemberData, ImportError, ImportWarning } from "../interfaces/import.interface";
export declare class ExcelParserService {
    private readonly logger;
    parseExcelFile(buffer: Buffer | Buffer<ArrayBufferLike>): Promise<{
        data: ImportMemberData[];
        errors: ImportError[];
        warnings: ImportWarning[];
    }>;
    private parseWorksheet;
    private extractHeaders;
    private parseRow;
    private getCellValue;
    private mapHeaderToField;
    private parseGender;
    private parseStatus;
    private parseNameList;
    validateExcelStructure(buffer: Buffer | Buffer<ArrayBufferLike>): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
}
