import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { File } from '@prisma/client';
export declare class UploadService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getFileType;
    private getFileUrl;
    uploadFile(file: Express.Multer.File, uploadedBy: string): Promise<File>;
    uploadProfileImage(file: Express.Multer.File, memberId: string): Promise<{
        file: File;
        profileUpdated: boolean;
    }>;
    deleteFile(fileId: string, userId: string): Promise<{
        message: string;
    }>;
    getFile(fileId: string): Promise<File>;
    getUserFiles(userId: string): Promise<File[]>;
}
