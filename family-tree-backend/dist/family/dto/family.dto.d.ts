import { FamilyRole as PrismaFamilyRole } from "@prisma/client";
export { PrismaFamilyRole as FamilyRole };
export declare class CreateFamilyDto {
    name: string;
    description?: string;
    isSubFamily?: boolean;
    parentFamilyId?: string;
    headOfFamilyId?: string;
    addCreatorAsMember?: boolean;
}
export declare class UpdateFamilyDto {
    name?: string;
    description?: string;
    headOfFamilyId?: string;
}
export declare class UpdateFamilyMembershipDto {
    role: PrismaFamilyRole;
    isActive?: boolean;
    manuallyEdited?: boolean;
}
export declare class AddMemberToFamilyDto {
    memberId: string;
    role: PrismaFamilyRole;
    type?: string;
}
export declare class FamilyResponseDto {
    id: string;
    name: string;
    description?: string;
    isSubFamily: boolean;
    creatorId: string;
    headOfFamilyId?: string;
    parentFamilyId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class FamilyMemberDto {
    id: string;
    name: string;
    role: PrismaFamilyRole;
    type: string;
    isActive: boolean;
    joinDate: Date;
}
export declare class FamilyWithMembersDto extends FamilyResponseDto {
    members: FamilyMemberDto[];
    subFamilies: FamilyResponseDto[];
}
