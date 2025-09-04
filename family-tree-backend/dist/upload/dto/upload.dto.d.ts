import { FileType } from '@prisma/client';
export declare class FileUploadDto {
    filename: string;
    originalName: string;
    mimeType: string;
    url: string;
    type: FileType;
    uploadedBy: string;
    size: number;
}
export declare class FileResponseDto {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    url: string;
    type: FileType;
    size: number;
    uploadedBy: string;
    uploadedAt: Date;
}
export declare class FileUploadResponseDto {
    file: FileResponseDto;
    url: string;
    message: string;
}
export declare class DeleteFileResponseDto {
    message: string;
}
