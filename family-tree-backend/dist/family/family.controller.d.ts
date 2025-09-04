import { FamilyService } from './family.service';
import { CreateFamilyDto, UpdateFamilyDto, UpdateFamilyMembershipDto, AddMemberToFamilyDto, FamilyResponseDto, FamilyWithMembersDto } from './dto/family.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
export declare class FamilyController {
    private readonly familyService;
    constructor(familyService: FamilyService);
    createFamily(user: AuthenticatedUser, createDto: CreateFamilyDto): Promise<FamilyResponseDto>;
    getMyFamilies(user: AuthenticatedUser): Promise<FamilyResponseDto[]>;
    getFamilyDetails(user: AuthenticatedUser, familyId: string): Promise<FamilyWithMembersDto>;
    updateFamily(user: AuthenticatedUser, familyId: string, updateDto: UpdateFamilyDto): Promise<FamilyResponseDto>;
    addMemberToFamily(user: AuthenticatedUser, familyId: string, addMemberDto: AddMemberToFamilyDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateFamilyMembership(user: AuthenticatedUser, familyId: string, memberId: string, updateDto: UpdateFamilyMembershipDto): Promise<{
        success: boolean;
        message: string;
    }>;
    removeMemberFromFamily(user: AuthenticatedUser, familyId: string, memberId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    recalculateSubFamilyMemberships(user: AuthenticatedUser, familyId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteFamily(user: AuthenticatedUser, familyId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
