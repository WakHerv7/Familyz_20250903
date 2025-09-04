import { Response } from 'express';
import { TreeService } from './tree.service';
import { FamilyTreeDto, ExportTreeDto, TreeStatisticsDto } from './dto/tree.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
export declare class TreeController {
    private readonly treeService;
    constructor(treeService: TreeService);
    getFamilyTree(user: AuthenticatedUser, familyId: string, centerMemberId?: string): Promise<FamilyTreeDto>;
    getTreeStatistics(user: AuthenticatedUser, familyId: string): Promise<TreeStatisticsDto>;
    exportFamilyTree(user: AuthenticatedUser, exportDto: ExportTreeDto, res: Response): Promise<void>;
    getMemberRelationships(user: AuthenticatedUser, familyId: string, memberId: string): Promise<{
        member: any;
        directRelationships: any[];
        indirectRelationships: any[];
        relationshipPath: any[];
    }>;
    getGenerationBreakdown(user: AuthenticatedUser, familyId: string): Promise<{
        [generation: number]: Array<{
            id: string;
            name: string;
            gender?: string;
            status: string;
        }>;
    }>;
}
