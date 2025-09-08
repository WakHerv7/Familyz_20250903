import { MemberService } from "./member.service";
import { UpdateMemberProfileDto, AddRelationshipDto, RemoveRelationshipDto, BulkRelationshipDto, CreateMemberDto, MemberRelationshipsResponseDto, MemberResponseDto } from "./dto/member.dto";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
export declare class MemberController {
    private readonly memberService;
    constructor(memberService: MemberService);
    getMyProfile(user: AuthenticatedUser): Promise<MemberRelationshipsResponseDto>;
    updateMyProfile(user: AuthenticatedUser, updateDto: UpdateMemberProfileDto, file?: Express.Multer.File): Promise<MemberResponseDto>;
    getMemberDetails(user: AuthenticatedUser, memberId: string): Promise<MemberRelationshipsResponseDto>;
    updateMember(user: AuthenticatedUser, memberId: string, updateDto: UpdateMemberProfileDto): Promise<MemberResponseDto>;
    addRelationship(user: AuthenticatedUser, relationshipDto: AddRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    addRelationshipToMember(user: AuthenticatedUser, memberId: string, relationshipDto: AddRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    removeRelationship(user: AuthenticatedUser, relationshipDto: RemoveRelationshipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    removeRelationshipFromMember(user: AuthenticatedUser, memberId: string, relationshipDto: RemoveRelationshipDto): Promise<{
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
}
