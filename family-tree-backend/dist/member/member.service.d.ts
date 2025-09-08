import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UpdateMemberProfileDto, AddRelationshipDto, RemoveRelationshipDto, BulkRelationshipDto, CreateMemberDto, MemberRelationshipsResponseDto, MemberResponseDto } from "./dto/member.dto";
export declare class MemberService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(user: AuthenticatedUser): Promise<MemberRelationshipsResponseDto>;
    updateProfile(user: AuthenticatedUser, updateDto: UpdateMemberProfileDto): Promise<MemberResponseDto>;
    updateProfileWithFile(user: AuthenticatedUser, updateDto: UpdateMemberProfileDto, file?: Express.Multer.File): Promise<MemberResponseDto>;
    getMemberDetails(user: AuthenticatedUser, memberId: string): Promise<MemberRelationshipsResponseDto>;
    updateMember(user: AuthenticatedUser, memberId: string, updateDto: UpdateMemberProfileDto): Promise<MemberResponseDto>;
    addRelationship(user: AuthenticatedUser, relationshipDto: AddRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    addRelationshipToMember(user: AuthenticatedUser, targetMemberId: string, relationshipDto: AddRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    removeRelationship(user: AuthenticatedUser, relationshipDto: RemoveRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    removeRelationshipFromMember(user: AuthenticatedUser, targetMemberId: string, relationshipDto: RemoveRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    addBulkRelationships(user: AuthenticatedUser, bulkDto: BulkRelationshipDto): Promise<{
        success: boolean;
        message: string;
        results: any[];
    }>;
    createMember(user: AuthenticatedUser, createDto: CreateMemberDto): Promise<MemberResponseDto>;
    getFamilyMembers(user: AuthenticatedUser, familyId: string): Promise<MemberResponseDto[]>;
    private verifyMemberAccess;
    private verifyFamilyAccess;
    private mapToMemberResponse;
}
