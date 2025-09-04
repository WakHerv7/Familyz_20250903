import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, RegistrationType } from './dto/auth.dto';
import { InvitationService } from '../invitation/invitation.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private invitationService: InvitationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ success: boolean; message: string; data: AuthResponseDto; family?: any }> {
    // Validate that either email or phone is provided
    if (!registerDto.email && !registerDto.phone) {
      throw new BadRequestException('Either email or phone number is required');
    }

    // Check for existing user
    const existingUser = await this.findExistingUser(registerDto.email, registerDto.phone);
    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Handle different registration types
    if (registerDto.registrationType === RegistrationType.CREATE_FAMILY) {
      return this.registerWithNewFamily(registerDto, hashedPassword);
    } else {
      return this.registerWithInvitation(registerDto, hashedPassword);
    }
  }

  private async registerWithNewFamily(registerDto: RegisterDto, hashedPassword: string) {
    if (!registerDto.familyName) {
      throw new BadRequestException('Family name is required when creating a new family');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: registerDto.email,
          phone: registerDto.phone,
          password: hashedPassword,
          emailVerified: !!registerDto.email,
          phoneVerified: !!registerDto.phone,
        },
      });

      // Create member profile
      const member = await prisma.member.create({
        data: {
          name: registerDto.name,
          gender: registerDto.gender as any,
          personalInfo: registerDto.personalInfo,
        },
      });

      // Link user to member
      await prisma.user.update({
        where: { id: user.id },
        data: { memberId: member.id },
      });

      // Create family
      const family = await prisma.family.create({
        data: {
          name: registerDto.familyName,
          description: registerDto.familyDescription,
          creatorId: member.id,
          headOfFamilyId: member.id,
        },
      });

      // Add member as admin of the family
      await prisma.familyMembership.create({
        data: {
          memberId: member.id,
          familyId: family.id,
          role: 'ADMIN',
          type: 'MAIN',
          autoEnrolled: false,
          manuallyEdited: false,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.phone, member.id);

      const userWithMember = await prisma.user.findUnique({
        where: { id: user.id },
        include: { member: true },
      });

      return {
        success: true,
        message: 'Registration successful. New family created.',
        data: {
          ...tokens,
          user: {
            id: userWithMember.id,
            email: userWithMember.email,
            phone: userWithMember.phone,
            member: {
              id: userWithMember.member.id,
              name: userWithMember.member.name,
              gender: userWithMember.member.gender,
            },
          },
        },
        family: {
          id: family.id,
          name: family.name,
          description: family.description,
        },
      };
    });
  }

  private async registerWithInvitation(registerDto: RegisterDto, hashedPassword: string) {
    if (!registerDto.invitationCode) {
      throw new BadRequestException('Invitation code is required when joining a family');
    }

    // Validate invitation
    const invitation = await this.invitationService.validateInvitation(registerDto.invitationCode);

    return this.prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: registerDto.email,
          phone: registerDto.phone,
          password: hashedPassword,
          emailVerified: !!registerDto.email,
          phoneVerified: !!registerDto.phone,
        },
      });

      // Create member profile
      const member = await prisma.member.create({
        data: {
          name: registerDto.name,
          gender: registerDto.gender as any,
          personalInfo: registerDto.personalInfo,
        },
      });

      // Link user to member
      await prisma.user.update({
        where: { id: user.id },
        data: { memberId: member.id },
      });

      // Add member to the family from invitation
      await prisma.familyMembership.create({
        data: {
          memberId: member.id,
          familyId: invitation.familyId,
          role: 'MEMBER',
          type: 'MAIN',
          autoEnrolled: false,
          manuallyEdited: false,
        },
      });

      // Mark invitation as used
      await this.invitationService.markInvitationAsUsed(registerDto.invitationCode, member.id);

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.phone, member.id);

      const userWithMember = await prisma.user.findUnique({
        where: { id: user.id },
        include: { member: true },
      });

      return {
        success: true,
        message: 'Registration successful. Welcome to the family!',
        data: {
          ...tokens,
          user: {
            id: userWithMember.id,
            email: userWithMember.email,
            phone: userWithMember.phone,
            member: {
              id: userWithMember.member.id,
              name: userWithMember.member.name,
              gender: userWithMember.member.gender,
            },
          },
        },
      };
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email or phone
    const user = await this.findUserByEmailOrPhone(loginDto.emailOrPhone);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.phone, user.memberId);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        member: user.member ? {
          id: user.member.id,
          name: user.member.name,
          gender: user.member.gender,
        } : null,
      },
    };
  }

  async refreshTokens(userId: string): Promise<Pick<AuthResponseDto, 'accessToken' | 'refreshToken'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user.id, user.email, user.phone, user.memberId);
  }

  private async generateTokens(userId: string, email?: string, phone?: string, memberId?: string) {
    const payload = {
      sub: userId,
      email,
      phone,
      memberId,
    };

    const accessTokenExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '7d';
    const refreshTokenExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessTokenExpiresIn }),
      this.jwtService.signAsync(payload, { expiresIn: refreshTokenExpiresIn }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpiresIn(accessTokenExpiresIn),
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    // Convert JWT expiration format to seconds
    if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn.slice(0, -1)) * 86400;
    } else if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn.slice(0, -1)) * 3600;
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn.slice(0, -1)) * 60;
    } else {
      return parseInt(expiresIn) || 604800; // Default 7 days
    }
  }

  private async findExistingUser(email?: string, phone?: string) {
    const whereConditions = [];

    if (email) {
      whereConditions.push({ email });
    }

    if (phone) {
      whereConditions.push({ phone });
    }

    if (whereConditions.length === 0) {
      return null;
    }

    return this.prisma.user.findFirst({
      where: {
        OR: whereConditions,
      },
    });
  }

  private async findUserByEmailOrPhone(emailOrPhone: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone },
        ],
      },
      include: {
        member: true,
      },
    });
  }
}
