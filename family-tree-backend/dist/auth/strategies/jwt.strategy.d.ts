import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email?: string;
    phone?: string;
    memberId?: string;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedUser {
    userId: string;
    email?: string;
    phone?: string;
    memberId?: string;
    member?: {
        id: string;
        name: string;
        gender?: string;
        familyMemberships: Array<{
            familyId: string;
            role: string;
            type: string;
            isActive: boolean;
        }>;
    };
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
