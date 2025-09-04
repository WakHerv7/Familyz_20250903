export declare class CreateCommentDto {
    content: string;
    imageUrl?: string;
    parentCommentId?: string;
}
export declare class UpdateCommentDto {
    content?: string;
    imageUrl?: string;
}
export declare class CommentQueryDto {
    page?: number;
    limit?: number;
    includeReplies?: boolean;
}
export declare class CommentResponseDto {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    likesCount: number;
    authorId: string;
    postId: string;
    parentCommentId: string | null;
    author: {
        id: string;
        name: string;
        personalInfo: any;
    };
    replies?: CommentResponseDto[];
    isLikedByCurrentUser?: boolean;
}
