import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { InvitationService } from '../invitation/invitation.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private invitationService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, invitationService: InvitationService);
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data: AuthResponseDto;
        family?: any;
    }>;
    private registerWithNewFamily;
    private registerWithInvitation;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    refreshTokens(userId: string): Promise<Pick<AuthResponseDto, 'accessToken' | 'refreshToken'>>;
    private generateTokens;
    private parseExpiresIn;
    private findExistingUser;
    private findUserByEmailOrPhone;
}
