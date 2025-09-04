import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto/post.dto';
export declare class PostService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(authorId: string, createPostDto: CreatePostDto): Promise<{
        commentsCount: number;
        likesCount: number;
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            name: string;
            personalInfo: import("@prisma/client/runtime/library").JsonValue;
            id: string;
        };
        id: string;
        createdAt: Date;
        familyId: string | null;
        updatedAt: Date;
        content: string;
        imageUrls: string[];
        videoUrl: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        editHistory: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getPosts(currentMemberId: string, query: PostQueryDto): Promise<{
        posts: {
            isLikedByCurrentUser: boolean;
            commentsCount: number;
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
            familyId: string | null;
            updatedAt: Date;
            content: string;
            imageUrls: string[];
            videoUrl: string | null;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            authorId: string;
            editHistory: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        pagination: {
            current: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getPostById(postId: string, currentMemberId: string): Promise<{
        isLikedByCurrentUser: boolean;
        commentsCount: number;
        likesCount: number;
        comments: {
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
        familyId: string | null;
        updatedAt: Date;
        content: string;
        imageUrls: string[];
        videoUrl: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        editHistory: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updatePost(postId: string, currentMemberId: string, updatePostDto: UpdatePostDto): Promise<{
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            name: string;
            personalInfo: import("@prisma/client/runtime/library").JsonValue;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        familyId: string | null;
        updatedAt: Date;
        content: string;
        imageUrls: string[];
        videoUrl: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        likesCount: number;
        editHistory: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deletePost(postId: string, currentMemberId: string): Promise<{
        message: string;
    }>;
    likePost(postId: string, memberId: string): Promise<{
        liked: boolean;
        message: string;
    }>;
    private getMemberFamilyIds;
    private validateFamilyAccess;
    private validatePostAccess;
    private createNewPostNotifications;
    private createLikeNotification;
}
