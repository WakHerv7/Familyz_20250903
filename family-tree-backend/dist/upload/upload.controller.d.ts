import { UploadService } from './upload.service';
import { File } from '@prisma/client';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        memberId: string;
    };
}
interface FileUploadResponse {
    file: File;
    url: string;
    message: string;
}
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    uploadFile(file: Express.Multer.File, req: AuthenticatedRequest): Promise<FileUploadResponse>;
    uploadProfileImage(file: Express.Multer.File, req: AuthenticatedRequest): Promise<FileUploadResponse>;
    deleteFile(fileId: string, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    getFile(fileId: string): Promise<File>;
    getUserFiles(req: AuthenticatedRequest): Promise<File[]>;
}
export {};
