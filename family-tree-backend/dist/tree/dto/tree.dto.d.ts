import { Gender as PrismaGender, MemberStatus as PrismaMemberStatus } from '@prisma/client';
export { PrismaGender as Gender, PrismaMemberStatus as MemberStatus };
export declare enum TreeFormat {
    JSON = "json",
    CSV = "csv",
    PDF = "pdf"
}
export declare class TreeNodeDto {
    id: string;
    name: string;
    gender?: PrismaGender;
    status: PrismaMemberStatus;
    personalInfo?: Record<string, unknown>;
    level: number;
    x: number;
    y: number;
    parentIds: string[];
    childrenIds: string[];
    spouseIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class TreeConnectionDto {
    from: string;
    to: string;
    type: 'parent' | 'spouse' | 'child';
    strength: number;
}
export declare class FamilyTreeDto {
    nodes: TreeNodeDto[];
    connections: TreeConnectionDto[];
    centerNodeId: string;
    familyId: string;
    familyName: string;
    totalMembers: number;
    generations: number;
}
export declare class ExportTreeDto {
    familyId: string;
    format: TreeFormat;
    includePersonalInfo?: boolean;
    includeInactiveMembers?: boolean;
}
export declare class TreeStatisticsDto {
    totalMembers: number;
    totalFamilies: number;
    totalGenerations: number;
    averageChildrenPerMember: number;
    oldestMember?: {
        id: string;
        name: string;
        birthYear?: number;
    };
    youngestMember?: {
        id: string;
        name: string;
        birthYear?: number;
    };
    genderDistribution: {
        male: number;
        female: number;
        other: number;
        unspecified: number;
    };
    statusDistribution: {
        active: number;
        inactive: number;
        deceased: number;
        archived: number;
    };
}
