import { PrismaService } from "@/prisma/prisma.service";
import { FamilyRole } from "@prisma/client";
interface ExportConfig {
    formats: ("pdf" | "excel")[];
    familyTree: {
        structure: "folderTree" | "traditional" | "interactive" | "textTree";
        includeMembersList: boolean;
        memberDetails: ("parent" | "children" | "spouses" | "personalInfo" | "contact")[];
    };
}
interface FolderTreeExportData {
    families: {
        id: string;
        name: string;
        members: {
            id: string;
            name: string;
            role: FamilyRole;
            generation: number;
            parents: any[];
            children: any[];
            spouses: any[];
            personalInfo?: any;
            color?: string;
            parentColors?: string[];
        }[];
    }[];
    membersList: any[];
    generatedAt: Date;
    exportConfig: ExportConfig;
}
export declare class TreeDataService {
    private prisma;
    constructor(prisma: PrismaService);
    getFamilyFolderTreeData(familyId: string): Promise<{
        column: number;
        value: string;
        memberIds: {
            id: string;
            name: string;
            gender: string;
            color: string;
            parentColors: string[];
        }[];
    }[]>;
    private generateExcelTreeFormatWithIds;
    getFolderTreeData(familyId?: string): Promise<FolderTreeExportData>;
    private normalizeRelationships;
    private getRelationshipLabel;
    private getGenderSymbol;
    private generateRandomColor;
    private assignColorsToMembers;
    private getColorDisplayString;
}
export {};
