import { ImportMemberData, ImportFamilyData, ImportError, ImportWarning } from "../interfaces/import.interface";
export declare class JsonParserService {
    private readonly logger;
    parseJsonFile(buffer: Buffer): Promise<{
        data: ImportMemberData[] | ImportFamilyData[];
        errors: ImportError[];
        warnings: ImportWarning[];
    }>;
    private parseJsonData;
    private parseFamilyObject;
    private parseMemberObject;
    private parseGender;
    private parseStatus;
    private parseNameList;
    validateJsonStructure(buffer: Buffer): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    generateJsonTemplate(): string;
}
