import { PrismaService } from '../prisma/prisma.service';
import { FamilyRole } from '@prisma/client';
interface ExportConfig {
    formats: ('pdf' | 'excel')[];
    familyTree: {
        structure: 'folderTree' | 'traditional' | 'interactive';
        includeMembersList: boolean;
        memberDetails: ('parent' | 'children' | 'spouses' | 'personalInfo' | 'contact')[];
    };
}
interface ExportRequest {
    format: 'pdf' | 'excel';
    scope: 'current-family' | 'all-families' | 'selected-families';
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
    getFolderTreeData(memberId: string): Promise<FolderTreeExportData>;
    exportFamilyData(memberId: string, exportRequest: ExportRequest): Promise<Buffer>;
    private generatePDF;
    private generateExcel;
}
export {};
