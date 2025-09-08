import { Gender, MemberStatus } from "@prisma/client";
export declare class ImportMemberDto {
    name: string;
    gender?: Gender;
    status?: MemberStatus;
    personalInfo?: PersonalInfoDto;
    color?: string;
    parentNames?: string[];
    spouseNames?: string[];
    familyName?: string;
    familyRole?: string;
}
export declare class PersonalInfoDto {
    bio?: string;
    birthDate?: string;
    birthPlace?: string;
    occupation?: string;
    socialLinks?: Record<string, string>;
}
export declare class ImportFamilyDto {
    name: string;
    description?: string;
    members: ImportMemberDto[];
}
export declare class StartImportDto {
    familyId?: string;
    importName?: string;
}
export declare class ImportProgressDto {
    importId: string;
}
export declare class ValidateImportDto {
    familyId?: string;
}
export declare class RollbackImportDto {
    importId: string;
}
