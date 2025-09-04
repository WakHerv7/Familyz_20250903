import { PostVisibility } from '@prisma/client';
export declare class CreatePostDto {
    content: string;
    imageUrls?: string[];
    videoUrl?: string;
    visibility: PostVisibility;
    familyId?: string;
}
export declare class UpdatePostDto {
    content?: string;
    imageUrls?: string[];
    videoUrl?: string;
    visibility?: PostVisibility;
}
export declare class PostQueryDto {
    page?: number;
    limit?: number;
    familyId?: string;
    visibility?: PostVisibility;
    authorId?: string;
}
export declare class PostResponseDto {
    id: string;
    content: string;
    imageUrls: string[];
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    visibility: PostVisibility;
    likesCount: number;
    authorId: string;
    familyId: string | null;
    author: {
        id: string;
        name: string;
        personalInfo: any;
    };
    isLikedByCurrentUser?: boolean;
    commentsCount?: number;
}
