import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { CreateFamilyDto, UpdateFamilyDto, UpdateFamilyMembershipDto, AddMemberToFamilyDto, FamilyResponseDto, FamilyWithMembersDto } from "./dto/family.dto";
export declare class FamilyService {
    private prisma;
    constructor(prisma: PrismaService);
    createFamily(user: AuthenticatedUser, createDto: CreateFamilyDto): Promise<FamilyResponseDto>;
    getFamilies(user: AuthenticatedUser): Promise<FamilyResponseDto[]>;
    getFamilyDetails(user: AuthenticatedUser, familyId: string): Promise<FamilyWithMembersDto>;
    updateFamily(user: AuthenticatedUser, familyId: string, updateDto: UpdateFamilyDto): Promise<FamilyResponseDto>;
    addMemberToFamily(user: AuthenticatedUser, familyId: string, addMemberDto: AddMemberToFamilyDto): Promise<void>;
    updateFamilyMembership(user: AuthenticatedUser, familyId: string, memberId: string, updateDto: UpdateFamilyMembershipDto): Promise<void>;
    removeMemberFromFamily(user: AuthenticatedUser, familyId: string, memberId: string): Promise<void>;
    softDeleteFamily(user: AuthenticatedUser, familyId: string): Promise<void>;
    restoreFamily(user: AuthenticatedUser, familyId: string): Promise<void>;
    deleteFamily(user: AuthenticatedUser, familyId: string): Promise<void>;
    recalculateSubFamilyMemberships(familyId: string): Promise<void>;
    private verifyFamilyAccess;
    private verifyFamilyAdminAccess;
    private verifyMemberAccess;
}
