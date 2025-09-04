import { InvitationService } from './invitation.service';
import { CreateInvitationDto, AcceptInvitationDto, InvitationResponseDto, InvitationValidationDto } from './dto/invitation.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
export declare class InvitationController {
    private readonly invitationService;
    constructor(invitationService: InvitationService);
    createInvitation(user: AuthenticatedUser, createDto: CreateInvitationDto): Promise<InvitationResponseDto>;
    validateInvitation(code: string): Promise<InvitationValidationDto>;
    acceptInvitation(acceptDto: AcceptInvitationDto): Promise<{
        success: boolean;
        message: string;
        accessToken: string;
        user: any;
    }>;
    getFamilyInvitations(user: AuthenticatedUser, familyId: string): Promise<InvitationResponseDto[]>;
    getMyInvitations(user: AuthenticatedUser): Promise<InvitationResponseDto[]>;
}
