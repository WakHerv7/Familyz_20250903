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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_dto_1 = require("./dto/auth.dto");
const invitation_service_1 = require("../invitation/invitation.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService, invitationService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.invitationService = invitationService;
    }
    async register(registerDto) {
        if (!registerDto.email && !registerDto.phone) {
            throw new common_1.BadRequestException('Either email or phone number is required');
        }
        const existingUser = await this.findExistingUser(registerDto.email, registerDto.phone);
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or phone already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 12);
        if (registerDto.registrationType === auth_dto_1.RegistrationType.CREATE_FAMILY) {
            return this.registerWithNewFamily(registerDto, hashedPassword);
        }
        else {
            return this.registerWithInvitation(registerDto, hashedPassword);
        }
    }
    async registerWithNewFamily(registerDto, hashedPassword) {
        if (!registerDto.familyName) {
            throw new common_1.BadRequestException('Family name is required when creating a new family');
        }
        return this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    email: registerDto.email,
                    phone: registerDto.phone,
                    password: hashedPassword,
                    emailVerified: !!registerDto.email,
                    phoneVerified: !!registerDto.phone,
                },
            });
            const member = await prisma.member.create({
                data: {
                    name: registerDto.name,
                    gender: registerDto.gender,
                    personalInfo: registerDto.personalInfo,
                },
            });
            await prisma.user.update({
                where: { id: user.id },
                data: { memberId: member.id },
            });
            const family = await prisma.family.create({
                data: {
                    name: registerDto.familyName,
                    description: registerDto.familyDescription,
                    creatorId: member.id,
                    headOfFamilyId: member.id,
                },
            });
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
    async registerWithInvitation(registerDto, hashedPassword) {
        if (!registerDto.invitationCode) {
            throw new common_1.BadRequestException('Invitation code is required when joining a family');
        }
        const invitation = await this.invitationService.validateInvitation(registerDto.invitationCode);
        return this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    email: registerDto.email,
                    phone: registerDto.phone,
                    password: hashedPassword,
                    emailVerified: !!registerDto.email,
                    phoneVerified: !!registerDto.phone,
                },
            });
            const member = await prisma.member.create({
                data: {
                    name: registerDto.name,
                    gender: registerDto.gender,
                    personalInfo: registerDto.personalInfo,
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
            await this.invitationService.markInvitationAsUsed(registerDto.invitationCode, member.id);
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
    async login(loginDto) {
        const user = await this.findUserByEmailOrPhone(loginDto.emailOrPhone);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
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
    async refreshTokens(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.generateTokens(user.id, user.email, user.phone, user.memberId);
    }
    async generateTokens(userId, email, phone, memberId) {
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
    parseExpiresIn(expiresIn) {
        if (expiresIn.endsWith('d')) {
            return parseInt(expiresIn.slice(0, -1)) * 86400;
        }
        else if (expiresIn.endsWith('h')) {
            return parseInt(expiresIn.slice(0, -1)) * 3600;
        }
        else if (expiresIn.endsWith('m')) {
            return parseInt(expiresIn.slice(0, -1)) * 60;
        }
        else {
            return parseInt(expiresIn) || 604800;
        }
    }
    async findExistingUser(email, phone) {
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
    async findUserByEmailOrPhone(emailOrPhone) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        invitation_service_1.InvitationService])
], AuthService);
//# sourceMappingURL=auth.service.js.map