import { PrismaService } from "../prisma/prisma.service";
import { FamilyRole } from "@prisma/client";
interface ExportConfig {
    formats: ("pdf" | "excel")[];
    familyTree: {
        structure: "folderTree" | "traditional" | "interactive" | "textTree";
        includeMembersList: boolean;
        memberDetails: ("parent" | "children" | "spouses" | "personalInfo" | "contact")[];
    };
}
interface ExportRequest {
    format: "pdf" | "excel";
    scope: "current-family" | "all-families" | "selected-families";
    familyIds?: string[];
    config: ExportConfig;
    includeData: {
        personalInfo: boolean;
        relationships: boolean;
        contactInfo: boolean;
        profileImages: boolean;
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
        }[];
    }[];
    membersList: any[];
    generatedAt: Date;
    exportConfig: ExportConfig;
}
export declare class ExportService {
    private prisma;
    constructor(prisma: PrismaService);
    getExplorerTreeData(memberId: string): Promise<{
        column: number;
        value: string;
    }[]>;
    getFolderTreeDataWithIds(memberId: string, familyId?: string): Promise<{
        column: number;
        value: string;
        memberIds: {
            id: string;
            name: string;
            gender: string;
        }[];
    }[]>;
    getFamilyFolderTreeData(memberId: string, familyId: string): Promise<{
        column: number;
        value: string;
        memberIds: {
            id: string;
            name: string;
            gender: string;
        }[];
    }[]>;
    getFolderTreeData(memberId: string, familyId?: string): Promise<FolderTreeExportData>;
    exportFamilyData(memberId: string, exportRequest: ExportRequest): Promise<{
        downloadUrl: string;
        filename: string;
        htmlUrl?: string;
        htmlFilename?: string;
    }>;
    private generatePDF;
    private generateTextTreeFormat;
    private findRootAncestors;
    private calculateProperGenerations;
    private getGenderSymbol;
    private calculateGenerations;
    private getSpouseText;
    private getRelationshipLabel;
    private normalizeRelationships;
    private generateExcelTreeFormatWithIds;
    private generateFamilyExcelTreeFormatWithIds;
    private generateExcelTreeFormat;
    private generateExcel;
}
export {};
