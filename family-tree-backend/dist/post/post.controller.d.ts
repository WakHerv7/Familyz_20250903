import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto/post.dto';
export declare class PostController {
    private readonly postService;
    constructor(postService: PostService);
    createPost(memberId: string, createPostDto: CreatePostDto): Promise<{
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
    getPosts(memberId: string, query: PostQueryDto): Promise<{
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
    getPostById(postId: string, memberId: string): Promise<{
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
    updatePost(postId: string, memberId: string, updatePostDto: UpdatePostDto): Promise<{
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
    deletePost(postId: string, memberId: string): Promise<{
        message: string;
    }>;
    likePost(postId: string, memberId: string): Promise<{
        liked: boolean;
        message: string;
    }>;
}
