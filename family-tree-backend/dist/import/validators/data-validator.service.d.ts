import { ImportMemberData, ImportFamilyData, ValidationResult, ImportError, ImportWarning } from "../interfaces/import.interface";
export declare class DataValidatorService {
    private readonly logger;
    validateImportData(data: ImportMemberData[] | ImportFamilyData[], familyId?: string): ValidationResult;
    private isFamilyData;
    private validateFamilyData;
    private validateMemberData;
    private validatePersonalInfo;
    private validateSocialLinks;
    private isValidHexColor;
    private isValidDate;
    validateRelationships(data: ImportMemberData[]): {
        errors: ImportError[];
        warnings: ImportWarning[];
    };
    sanitizeImportData(data: ImportMemberData[]): ImportMemberData[];
}
