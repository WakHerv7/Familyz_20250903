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
exports.CommentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CommentService = class CommentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createComment(postId, authorId, createCommentDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        await this.validatePostAccess(post, authorId);
        if (createCommentDto.parentCommentId) {
            const parentComment = await this.prisma.comment.findUnique({
                where: { id: createCommentDto.parentCommentId },
            });
            if (!parentComment || parentComment.postId !== postId) {
                throw new common_1.NotFoundException('Parent comment not found');
            }
        }
        const comment = await this.prisma.comment.create({
            data: {
                ...createCommentDto,
                postId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        personalInfo: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        });
        if (post.authorId !== authorId) {
            await this.createCommentNotification(postId, comment.id, authorId, post.authorId);
        }
        return {
            ...comment,
            likesCount: comment._count.likes,
            repliesCount: comment._count.replies,
        };
    }
    async getCommentsByPost(postId, currentMemberId, query) {
        const { page = 1, limit = 20, includeReplies = true } = query;
        const skip = (page - 1) * limit;
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        await this.validatePostAccess(post, currentMemberId);
        const comments = await this.prisma.comment.findMany({
            where: {
                postId,
                parentCommentId: null,
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        personalInfo: true,
                    },
                },
                likes: {
                    where: { memberId: currentMemberId },
                    select: { id: true },
                },
                replies: includeReplies ? {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                personalInfo: true,
                            },
                        },
                        likes: {
                            where: { memberId: currentMemberId },
                            select: { id: true },
                        },
                        _count: {
                            select: { likes: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                } : undefined,
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        });
        const commentsWithMetadata = comments.map(comment => ({
            ...comment,
            isLikedByCurrentUser: comment.likes.length > 0,
            likesCount: comment._count.likes,
            repliesCount: comment._count.replies,
            replies: includeReplies ? comment.replies?.map(reply => ({
                ...reply,
                isLikedByCurrentUser: reply.likes.length > 0,
                likesCount: reply._count.likes,
                likes: undefined,
                _count: undefined,
            })) : undefined,
            likes: undefined,
            _count: undefined,
        }));
        return commentsWithMetadata;
    }
    async updateComment(commentId, currentMemberId, updateCommentDto) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.authorId !== currentMemberId) {
            throw new common_1.ForbiddenException('You can only edit your own comments');
        }
        return this.prisma.comment.update({
            where: { id: commentId },
            data: updateCommentDto,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        personalInfo: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        });
    }
    async deleteComment(commentId, currentMemberId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                replies: true,
            },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.authorId !== currentMemberId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.prisma.comment.delete({
            where: { id: commentId },
        });
        return { message: 'Comment deleted successfully' };
    }
    async likeComment(commentId, memberId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                post: true,
            },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        await this.validatePostAccess(comment.post, memberId);
        const existingLike = await this.prisma.commentLike.findUnique({
            where: {
                commentId_memberId: {
                    commentId,
                    memberId,
                },
            },
        });
        if (existingLike) {
            await this.prisma.$transaction([
                this.prisma.commentLike.delete({
                    where: { id: existingLike.id },
                }),
                this.prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        likesCount: {
                            decrement: 1,
                        },
                    },
                }),
            ]);
            return { liked: false, message: 'Comment unliked' };
        }
        else {
            await this.prisma.$transaction([
                this.prisma.commentLike.create({
                    data: {
                        commentId,
                        memberId,
                    },
                }),
                this.prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        likesCount: {
                            increment: 1,
                        },
                    },
                }),
            ]);
            if (comment.authorId !== memberId) {
                await this.createCommentLikeNotification(commentId, memberId, comment.authorId);
            }
            return { liked: true, message: 'Comment liked' };
        }
    }
    async getMemberFamilyIds(memberId) {
        const memberships = await this.prisma.familyMembership.findMany({
            where: {
                memberId,
                isActive: true,
            },
            select: {
                familyId: true,
            },
        });
        return memberships.map(m => m.familyId);
    }
    async validatePostAccess(post, currentMemberId) {
        if (post.visibility === client_1.PostVisibility.PUBLIC) {
            return;
        }
        if (post.authorId === currentMemberId) {
            return;
        }
        const memberFamilies = await this.getMemberFamilyIds(currentMemberId);
        if (post.visibility === client_1.PostVisibility.FAMILY) {
            if (post.familyId && !memberFamilies.includes(post.familyId)) {
                throw new common_1.ForbiddenException('You do not have access to this post');
            }
            const authorFamilies = await this.getMemberFamilyIds(post.authorId);
            const hasCommonFamily = memberFamilies.some(fId => authorFamilies.includes(fId));
            if (!hasCommonFamily) {
                throw new common_1.ForbiddenException('You do not have access to this post');
            }
        }
        if (post.visibility === client_1.PostVisibility.SUBFAMILY) {
            const authorFamilies = await this.getMemberFamilyIds(post.authorId);
            const hasCommonFamily = memberFamilies.some(fId => authorFamilies.includes(fId));
            if (!hasCommonFamily) {
                throw new common_1.ForbiddenException('You do not have access to this post');
            }
        }
    }
    async createCommentNotification(postId, commentId, commenterId, postAuthorId) {
        await this.prisma.notification.create({
            data: {
                type: 'NEW_COMMENT',
                message: 'commented on your post',
                memberId: postAuthorId,
                relatedPostId: postId,
                relatedCommentId: commentId,
                relatedMemberId: commenterId,
            },
        });
    }
    async createCommentLikeNotification(commentId, likerId, commentAuthorId) {
        await this.prisma.notification.create({
            data: {
                type: 'COMMENT_LIKE',
                message: 'liked your comment',
                memberId: commentAuthorId,
                relatedCommentId: commentId,
                relatedMemberId: likerId,
            },
        });
    }
};
exports.CommentService = CommentService;
exports.CommentService = CommentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommentService);
//# sourceMappingURL=comment.service.js.map