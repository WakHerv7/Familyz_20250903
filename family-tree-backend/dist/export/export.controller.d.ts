import { Response } from "express";
import { ExportService } from "./export.service";
import { TreeDataService } from "@/common/services/treeData.service";
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        memberId: string;
    };
}
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
            role: string;
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
export declare class ExportController {
    private exportService;
    private treeeDataService;
    constructor(exportService: ExportService, treeeDataService: TreeDataService);
    getFolderTreeData(req: AuthenticatedRequest): Promise<FolderTreeExportData>;
    getExplorerTreeData(req: AuthenticatedRequest): Promise<{
        column: number;
        value: string;
    }[]>;
    getFolderTreeDataWithIds(req: AuthenticatedRequest, params: any, familyId?: string): Promise<{
        column: number;
        value: string;
        memberIds: {
            id: string;
            name: string;
            gender: string;
        }[];
    }[]>;
    getFamilyFolderTreeData(req: AuthenticatedRequest, familyId: string): Promise<{
        column: number;
        value: string;
        memberIds: {
            id: string;
            name: string;
            gender: string;
        }[];
    }[]>;
    downloadFile(filename: string, res: Response): Promise<void>;
    exportFamilyData(exportRequest: ExportRequest, req: AuthenticatedRequest): Promise<{
        downloadUrl: string;
        filename: string;
    }>;
}
export {};
