import { Gender as PrismaGender, MemberStatus as PrismaMemberStatus, FamilyRole as PrismaFamilyRole } from '@prisma/client';
export { PrismaGender as Gender, PrismaMemberStatus as MemberStatus, PrismaFamilyRole as FamilyRole };
export declare enum RelationshipType {
    PARENT = "PARENT",
    SPOUSE = "SPOUSE",
    CHILD = "CHILD"
}
export declare class UpdateMemberProfileDto {
    name?: string;
    gender?: PrismaGender;
    status?: PrismaMemberStatus;
    personalInfo?: any;
}
export declare class AddRelationshipDto {
    relatedMemberId: string;
    relationshipType: RelationshipType;
}
export declare class RemoveRelationshipDto {
    relatedMemberId: string;
    relationshipType: RelationshipType;
}
export declare class BulkRelationshipDto {
    relationships: AddRelationshipDto[];
}
export declare class CreateMemberDto {
    name: string;
    gender?: PrismaGender;
    status?: PrismaMemberStatus;
    personalInfo?: any;
    familyId: string;
    role?: PrismaFamilyRole;
    initialRelationships?: AddRelationshipDto[];
}
export declare class FamilyMembershipDto {
    id: string;
    familyId: string;
    familyName: string;
    role: PrismaFamilyRole;
    type: string;
    autoEnrolled: boolean;
    manuallyEdited: boolean;
    isActive: boolean;
    joinDate: Date;
}
export declare class MemberResponseDto {
    id: string;
    name: string;
    gender?: PrismaGender;
    status: PrismaMemberStatus;
    personalInfo?: any;
    createdAt: Date;
    updatedAt: Date;
    familyMemberships?: FamilyMembershipDto[];
}
export declare class SimpleMemberDto {
    id: string;
    name: string;
    gender?: PrismaGender;
}
export declare class MemberRelationshipsResponseDto extends MemberResponseDto {
    parents: SimpleMemberDto[];
    children: SimpleMemberDto[];
    spouses: SimpleMemberDto[];
    familyMemberships: FamilyMembershipDto[];
}
