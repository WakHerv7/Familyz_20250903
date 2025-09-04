import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class InvitationService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateInvitation(code: string) {
    try {
      // Decode JWT invitation
      const payload = this.jwtService.verify(code, {
        secret: this.configService.get('INVITATION_JWT_SECRET'),
      }) as InvitationPayload;

      // Find invitation in database
      const invitation = await this.prisma.invitation.findUnique({
        where: { code },
        include: {
          family: true,
          inviterUser: true,
          inviterMember: true,
        },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.status !== 'VALID') {
        throw new BadRequestException('Invitation is no longer valid');
      }

      if (invitation.expiresAt < new Date()) {
        // Mark as expired
        await this.prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Invitation has expired');
      }

      return invitation;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Invalid or expired invitation code');
      }
      throw error;
    }
  }

  async markInvitationAsUsed(code: string, acceptedBy: string) {
    return this.prisma.invitation.update({
      where: { code },
      data: {
        status: 'USED',
        usedAt: new Date(),
        acceptedBy,
      },
    });
  }

  async createInvitation(user: any, createDto: any): Promise<any> {
    // Verify user has access to the family
    const familyMembership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: user.memberId,
        familyId: createDto.familyId,
        isActive: true,
        role: { in: ['ADMIN', 'HEAD'] },
      },
      include: {
        family: true,
        member: true,
      },
    });

    if (!familyMembership) {
      throw new NotFoundException('Family not found or insufficient permissions');
    }

    // Generate JWT invitation code
    const payload: InvitationPayload = {
      familyId: createDto.familyId,
      inviterId: user.id,
      inviterType: 'USER',
      memberStub: createDto.memberStub,
    };

    const expiresIn = this.configService.get('INVITATION_EXPIRES_IN') || '7d';
    const code = this.jwtService.sign(payload, {
      secret: this.configService.get('INVITATION_JWT_SECRET'),
      expiresIn,
    });

    // Calculate expiration date
    const expiresAt = new Date();
    const expiresInMs = this.parseExpiresIn(expiresIn);
    expiresAt.setTime(expiresAt.getTime() + expiresInMs);

    // Create invitation record
    const invitation = await this.prisma.invitation.create({
      data: {
        code,
        familyId: createDto.familyId,
        inviterUserId: user.id,
        memberStub: createDto.memberStub,
        expiresAt,
        status: 'VALID',
      },
    });

    return {
      id: invitation.id,
      code: invitation.code,
      familyId: invitation.familyId,
      familyName: familyMembership.family.name,
      inviterName: familyMembership.member.name,
      memberStub: invitation.memberStub,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async validateInvitationCode(code: string): Promise<any> {
    try {
      const invitation = await this.validateInvitation(code);

      return {
        isValid: true,
        familyName: invitation.family.name,
        inviterName: invitation.inviterUser?.email || invitation.inviterMember?.name || 'Unknown',
        memberStub: invitation.memberStub,
        expiresAt: invitation.expiresAt,
      };
    } catch (error) {
      return {
        isValid: false,
        familyName: '',
        inviterName: '',
        memberStub: null,
        expiresAt: new Date(),
      };
    }
  }

  async acceptInvitation(acceptDto: any): Promise<any> {
    // Validate invitation first
    const invitation = await this.validateInvitation(acceptDto.invitationCode);

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: acceptDto.email },
          { phone: acceptDto.phone },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email or phone already exists');
    }

    // Create user and member in transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Hash password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(acceptDto.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: acceptDto.email,
          phone: acceptDto.phone,
          password: hashedPassword,
        },
      });

      // Create member
      const member = await prisma.member.create({
        data: {
          name: acceptDto.name,
          personalInfo: acceptDto.personalInfo,
        },
      });

      // Link user to member
      await prisma.user.update({
        where: { id: user.id },
        data: { memberId: member.id },
      });

      // Add member to family
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
      await this.markInvitationAsUsed(acceptDto.invitationCode, member.id);

      return { user, member };
    });

    // Generate access token
    const jwtService = new (require('@nestjs/jwt')).JwtService({
      secret: this.configService.get('JWT_SECRET'),
    });

    const accessToken = jwtService.sign({
      sub: result.user.id,
      email: result.user.email,
      phone: result.user.phone,
      memberId: result.member.id,
    });

    return {
      success: true,
      message: 'Invitation accepted successfully',
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        memberId: result.member.id,
        member: result.member,
      },
    };
  }

  async getFamilyInvitations(user: any, familyId: string): Promise<any[]> {
    // Verify user has access to the family
    const familyMembership = await this.prisma.familyMembership.findFirst({
      where: {
        memberId: user.memberId,
        familyId,
        isActive: true,
      },
      include: {
        family: true,
      },
    });

    if (!familyMembership) {
      throw new NotFoundException('Family not found or access denied');
    }

    const invitations = await this.prisma.invitation.findMany({
      where: { familyId },
      include: {
        inviterUser: true,
        inviterMember: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map(invitation => ({
      id: invitation.id,
      code: invitation.code,
      familyId: invitation.familyId,
      familyName: familyMembership.family.name,
      inviterName: invitation.inviterUser?.email || invitation.inviterMember?.name || 'Unknown',
      memberStub: invitation.memberStub,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    }));
  }

  async getUserInvitations(user: any): Promise<any[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: { inviterUserId: user.id },
      include: {
        family: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map(invitation => ({
      id: invitation.id,
      code: invitation.code,
      familyId: invitation.familyId,
      familyName: invitation.family.name,
      inviterName: user.email || user.phone,
      memberStub: invitation.memberStub,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    }));
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      case 'w': return num * 7 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
