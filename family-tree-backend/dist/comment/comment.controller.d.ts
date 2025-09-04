import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto/comment.dto';
export declare class CommentController {
    private readonly commentService;
    constructor(commentService: CommentService);
    createComment(postId: string, memberId: string, createCommentDto: CreateCommentDto): Promise<{
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
    getComments(postId: string, memberId: string, query: CommentQueryDto): Promise<{
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
}
export declare class CommentManagementController {
    private readonly commentService;
    constructor(commentService: CommentService);
    updateComment(commentId: string, memberId: string, updateCommentDto: UpdateCommentDto): Promise<{
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
    deleteComment(commentId: string, memberId: string): Promise<{
        message: string;
    }>;
    likeComment(commentId: string, memberId: string): Promise<{
        liked: boolean;
        message: string;
    }>;
}
