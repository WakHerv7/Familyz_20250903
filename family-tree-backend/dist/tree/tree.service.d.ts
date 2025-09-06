import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { FamilyTreeDto, ExportTreeDto, TreeStatisticsDto } from "./dto/tree.dto";
export declare class TreeService {
    private prisma;
    constructor(prisma: PrismaService);
    getFamilyTree(user: AuthenticatedUser, familyId: string, centerMemberId?: string): Promise<FamilyTreeDto>;
    getTreeStatistics(user: AuthenticatedUser, familyId: string): Promise<TreeStatisticsDto>;
    exportFamilyTree(user: AuthenticatedUser, exportDto: ExportTreeDto): Promise<Buffer | string>;
    private verifyFamilyAccess;
    private getVisibleMembers;
    private getUserFamilyIds;
    private buildTreeStructure;
    private calculateNodePositions;
    private calculateGenerations;
    private exportAsJson;
    private exportAsCsv;
    private exportAsPdf;
}
