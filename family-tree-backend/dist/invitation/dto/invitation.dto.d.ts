export declare class CreateInvitationDto {
    familyId: string;
    memberStub?: Record<string, unknown>;
}
export declare class AcceptInvitationDto {
    invitationCode: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    personalInfo?: Record<string, unknown>;
}
export declare class InvitationResponseDto {
    id: string;
    code: string;
    familyId: string;
    familyName: string;
    inviterName?: string;
    memberStub?: Record<string, unknown>;
    status: string;
    expiresAt: Date;
    createdAt: Date;
}
export declare class InvitationValidationDto {
    isValid: boolean;
    familyName: string;
    inviterName: string;
    memberStub?: Record<string, unknown>;
    expiresAt: Date;
}
