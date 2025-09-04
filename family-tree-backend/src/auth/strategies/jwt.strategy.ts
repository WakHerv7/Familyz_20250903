import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // User ID
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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
        isActive: true,
      },
      include: {
        member: {
          include: {
            familyMemberships: {
              where: {
                isActive: true,
              },
              select: {
                familyId: true,
                role: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token or user not found');
    }

    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      memberId: user.memberId,
      member: user.member ? {
        id: user.member.id,
        name: user.member.name,
        gender: user.member.gender,
        familyMemberships: user.member.familyMemberships,
      } : undefined,
    };
  }
}
