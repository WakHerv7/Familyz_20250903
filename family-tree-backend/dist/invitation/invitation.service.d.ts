import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface InvitationPayload {
    familyId: string;
    inviterId: string;
    inviterType: 'USER' | 'MEMBER';
    memberStub?: any;
    iat?: number;
    exp?: number;
}
export declare class InvitationService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    validateInvitation(code: string): Promise<{
        family: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isSubFamily: boolean;
            creatorId: string;
            headOfFamilyId: string | null;
            parentFamilyId: string | null;
        };
        inviterUser: {
            email: string | null;
            phone: string | null;
            password: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            memberId: string | null;
            isActive: boolean;
            emailVerified: boolean;
            phoneVerified: boolean;
        };
        inviterMember: {
            name: string;
            gender: import(".prisma/client").$Enums.Gender | null;
            personalInfo: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.MemberStatus;
            updatedAt: Date;
        };
    } & {
        id: string;
        code: string;
        createdAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        usedAt: Date | null;
        acceptedBy: string | null;
        familyId: string;
        inviterUserId: string | null;
        inviterMemberId: string | null;
        memberStub: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    markInvitationAsUsed(code: string, acceptedBy: string): Promise<{
        id: string;
        code: string;
        createdAt: Date;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        usedAt: Date | null;
        acceptedBy: string | null;
        familyId: string;
        inviterUserId: string | null;
        inviterMemberId: string | null;
        memberStub: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createInvitation(user: any, createDto: any): Promise<any>;
    validateInvitationCode(code: string): Promise<any>;
    acceptInvitation(acceptDto: any): Promise<any>;
    getFamilyInvitations(user: any, familyId: string): Promise<any[]>;
    getUserInvitations(user: any): Promise<any[]>;
    private parseExpiresIn;
}
