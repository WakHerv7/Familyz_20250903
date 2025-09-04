import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto/comment.dto';
export declare class CommentService {
    private prisma;
    constructor(prisma: PrismaService);
    createComment(postId: string, authorId: string, createCommentDto: CreateCommentDto): Promise<{
        likesCount: number;
        repliesCount: number;
        _count: {
            likes: number;
            replies: number;
        };
        author: {
            name: string;
            personalInfo: import("@prisma/client/runtime/library").JsonValue;
            id: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        postId: string;
        imageUrl: string | null;
        parentCommentId: string | null;
    }>;
    getCommentsByPost(postId: string, currentMemberId: string, query: CommentQueryDto): Promise<{
        isLikedByCurrentUser: boolean;
        likesCount: number;
        repliesCount: number;
        replies: {
            isLikedByCurrentUser: boolean;
            likesCount: number;
            likes: any;
            _count: any;
            author: {
                name: string;
                personalInfo: import("@prisma/client/runtime/library").JsonValue;
                id: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            authorId: string;
            postId: string;
            imageUrl: string | null;
            parentCommentId: string | null;
        }[];
        likes: any;
        _count: any;
        author: {
            name: string;
            personalInfo: import("@prisma/client/runtime/library").JsonValue;
            id: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        postId: string;
        imageUrl: string | null;
        parentCommentId: string | null;
    }[]>;
    updateComment(commentId: string, currentMemberId: string, updateCommentDto: UpdateCommentDto): Promise<{
        _count: {
            likes: number;
            replies: number;
        };
        author: {
            name: string;
            personalInfo: import("@prisma/client/runtime/library").JsonValue;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        likesCount: number;
        postId: string;
        imageUrl: string | null;
        parentCommentId: string | null;
    }>;
    deleteComment(commentId: string, currentMemberId: string): Promise<{
        message: string;
    }>;
    likeComment(commentId: string, memberId: string): Promise<{
        liked: boolean;
        message: string;
    }>;
    private getMemberFamilyIds;
    private validatePostAccess;
    private createCommentNotification;
    private createCommentLikeNotification;
}
