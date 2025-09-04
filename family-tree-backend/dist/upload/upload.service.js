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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
let UploadService = class UploadService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    getFileType(mimeType) {
        if (mimeType.startsWith('image/'))
            return client_1.FileType.IMAGE;
        if (mimeType.startsWith('video/'))
            return client_1.FileType.VIDEO;
        if (mimeType.startsWith('audio/'))
            return client_1.FileType.AUDIO;
        return client_1.FileType.DOCUMENT;
    }
    getFileUrl(filename) {
        const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3001';
        return `${baseUrl}/uploads/${filename}`;
    }
    async uploadFile(file, uploadedBy) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        try {
            const fileType = this.getFileType(file.mimetype);
            const fileUrl = this.getFileUrl(file.filename);
            const uploadedFile = await this.prisma.file.create({
                data: {
                    filename: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: fileUrl,
                    type: fileType,
                    uploadedBy,
                },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            return uploadedFile;
        }
        catch (error) {
            if (file.filename) {
                const filePath = path.join('./uploads', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            throw error;
        }
    }
    async uploadProfileImage(file, memberId) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('Profile image must be an image file');
        }
        const uploadedFile = await this.uploadFile(file, memberId);
        try {
            const member = await this.prisma.member.findUnique({
                where: { id: memberId },
                select: { personalInfo: true },
            });
            if (!member) {
                throw new common_1.NotFoundException('Member not found');
            }
            const personalInfo = member.personalInfo || {};
            const oldProfileImageId = personalInfo.profileImageId;
            await this.prisma.member.update({
                where: { id: memberId },
                data: {
                    personalInfo: {
                        ...personalInfo,
                        profileImage: uploadedFile.url,
                        profileImageId: uploadedFile.id,
                    },
                },
            });
            if (oldProfileImageId) {
                try {
                    await this.deleteFile(oldProfileImageId, memberId);
                }
                catch (error) {
                    console.warn('Failed to delete old profile image:', error);
                }
            }
            return { file: uploadedFile, profileUpdated: true };
        }
        catch (error) {
            await this.deleteFile(uploadedFile.id, memberId);
            throw error;
        }
    }
    async deleteFile(fileId, userId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (file.uploadedBy !== userId) {
            throw new common_1.BadRequestException('You can only delete your own files');
        }
        const filePath = path.join('./uploads', file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        await this.prisma.file.delete({
            where: { id: fileId },
        });
        return { message: 'File deleted successfully' };
    }
    async getFile(fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        return file;
    }
    async getUserFiles(userId) {
        return await this.prisma.file.findMany({
            where: { uploadedBy: userId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map