"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let InvitationService = class InvitationService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateInvitation(code) {
        try {
            const payload = this.jwtService.verify(code, {
                secret: this.configService.get('INVITATION_JWT_SECRET'),
            });
            const invitation = await this.prisma.invitation.findUnique({
                where: { code },
                include: {
                    family: true,
                    inviterUser: true,
                    inviterMember: true,
                },
            });
            if (!invitation) {
                throw new common_1.NotFoundException('Invitation not found');
            }
            if (invitation.status !== 'VALID') {
                throw new common_1.BadRequestException('Invitation is no longer valid');
            }
            if (invitation.expiresAt < new Date()) {
                await this.prisma.invitation.update({
                    where: { id: invitation.id },
                    data: { status: 'EXPIRED' },
                });
                throw new common_1.BadRequestException('Invitation has expired');
            }
            return invitation;
        }
        catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                throw new common_1.BadRequestException('Invalid or expired invitation code');
            }
            throw error;
        }
    }
    async markInvitationAsUsed(code, acceptedBy) {
        return this.prisma.invitation.update({
            where: { code },
            data: {
                status: 'USED',
                usedAt: new Date(),
                acceptedBy,
            },
        });
    }
    async createInvitation(user, createDto) {
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
            throw new common_1.NotFoundException('Family not found or insufficient permissions');
        }
        const payload = {
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
        const expiresAt = new Date();
        const expiresInMs = this.parseExpiresIn(expiresIn);
        expiresAt.setTime(expiresAt.getTime() + expiresInMs);
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
    async validateInvitationCode(code) {
        try {
            const invitation = await this.validateInvitation(code);
            return {
                isValid: true,
                familyName: invitation.family.name,
                inviterName: invitation.inviterUser?.email || invitation.inviterMember?.name || 'Unknown',
                memberStub: invitation.memberStub,
                expiresAt: invitation.expiresAt,
            };
        }
        catch (error) {
            return {
                isValid: false,
                familyName: '',
                inviterName: '',
                memberStub: null,
                expiresAt: new Date(),
            };
        }
    }
    async acceptInvitation(acceptDto) {
        const invitation = await this.validateInvitation(acceptDto.invitationCode);
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: acceptDto.email },
                    { phone: acceptDto.phone },
                ],
            },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email or phone already exists');
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(acceptDto.password, 12);
            const user = await prisma.user.create({
                data: {
                    email: acceptDto.email,
                    phone: acceptDto.phone,
                    password: hashedPassword,
                },
            });
            const member = await prisma.member.create({
                data: {
                    name: acceptDto.name,
                    personalInfo: acceptDto.personalInfo,
                },
            });
            await prisma.user.update({
                where: { id: user.id },
                data: { memberId: member.id },
            });
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
            await this.markInvitationAsUsed(acceptDto.invitationCode, member.id);
            return { user, member };
        });
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
    async getFamilyInvitations(user, familyId) {
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
            throw new common_1.NotFoundException('Family not found or access denied');
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
    async getUserInvitations(user) {
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
    parseExpiresIn(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhdw])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000;
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
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map