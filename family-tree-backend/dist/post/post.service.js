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
exports.PostService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PostService = class PostService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(authorId, createPostDto) {
        if (createPostDto.familyId) {
            await this.validateFamilyAccess(authorId, createPostDto.familyId);
        }
        const post = await this.prisma.post.create({
            data: {
                ...createPostDto,
                authorId,
                editHistory: {
                    created: {
                        timestamp: new Date(),
                        content: createPostDto.content,
                    },
                },
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
                        comments: true,
                        likes: true,
                    },
                },
            },
        });
        if (createPostDto.visibility !== client_1.PostVisibility.PUBLIC) {
            await this.createNewPostNotifications(post.id, authorId, createPostDto.familyId);
        }
        return {
            ...post,
            commentsCount: post._count.comments,
            likesCount: post._count.likes,
        };
    }
    async getPosts(currentMemberId, query) {
        const { page = 1, limit = 10, familyId, visibility, authorId } = query;
        const skip = (page - 1) * limit;
        const memberFamilies = await this.getMemberFamilyIds(currentMemberId);
        const whereClause = {
            OR: [
                { visibility: client_1.PostVisibility.PUBLIC },
                {
                    AND: [
                        { visibility: client_1.PostVisibility.FAMILY },
                        {
                            OR: [
                                { authorId: currentMemberId },
                                { familyId: { in: memberFamilies } },
                                {
                                    author: {
                                        familyMemberships: {
                                            some: {
                                                familyId: { in: memberFamilies },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        if (familyId) {
            whereClause.familyId = familyId;
        }
        if (visibility) {
            whereClause.visibility = visibility;
        }
        if (authorId) {
            whereClause.authorId = authorId;
        }
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: whereClause,
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
                    _count: {
                        select: {
                            comments: true,
                            likes: true,
                        },
                    },
                },
            }),
            this.prisma.post.count({ where: whereClause }),
        ]);
        const postsWithMetadata = posts.map(post => ({
            ...post,
            isLikedByCurrentUser: post.likes.length > 0,
            commentsCount: post._count.comments,
            likesCount: post._count.likes,
            likes: undefined,
            _count: undefined,
        }));
        return {
            posts: postsWithMetadata,
            pagination: {
                current: page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getPostById(postId, currentMemberId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
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
                comments: {
                    where: { parentCommentId: null },
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
                        replies: {
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
                        },
                        _count: {
                            select: {
                                likes: true,
                                replies: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true,
                    },
                },
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        await this.validatePostAccess(post, currentMemberId);
        const commentsWithMetadata = post.comments.map(comment => ({
            ...comment,
            isLikedByCurrentUser: comment.likes.length > 0,
            likesCount: comment._count.likes,
            repliesCount: comment._count.replies,
            replies: comment.replies.map(reply => ({
                ...reply,
                isLikedByCurrentUser: reply.likes.length > 0,
                likesCount: reply._count.likes,
                likes: undefined,
                _count: undefined,
            })),
            likes: undefined,
            _count: undefined,
        }));
        return {
            ...post,
            isLikedByCurrentUser: post.likes.length > 0,
            commentsCount: post._count.comments,
            likesCount: post._count.likes,
            comments: commentsWithMetadata,
            likes: undefined,
            _count: undefined,
        };
    }
    async updatePost(postId, currentMemberId, updatePostDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.authorId !== currentMemberId) {
            throw new common_1.ForbiddenException('You can only edit your own posts');
        }
        const currentHistory = post.editHistory || {};
        const editHistory = {
            ...currentHistory,
            [`edit_${Date.now()}`]: {
                timestamp: new Date(),
                content: updatePostDto.content || post.content,
                previousContent: post.content,
            },
        };
        return this.prisma.post.update({
            where: { id: postId },
            data: {
                ...updatePostDto,
                editHistory,
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
                        comments: true,
                        likes: true,
                    },
                },
            },
        });
    }
    async deletePost(postId, currentMemberId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.authorId !== currentMemberId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        await this.prisma.post.delete({
            where: { id: postId },
        });
        return { message: 'Post deleted successfully' };
    }
    async likePost(postId, memberId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        await this.validatePostAccess(post, memberId);
        const existingLike = await this.prisma.postLike.findUnique({
            where: {
                postId_memberId: {
                    postId,
                    memberId,
                },
            },
        });
        if (existingLike) {
            await this.prisma.$transaction([
                this.prisma.postLike.delete({
                    where: { id: existingLike.id },
                }),
                this.prisma.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: {
                            decrement: 1,
                        },
                    },
                }),
            ]);
            return { liked: false, message: 'Post unliked' };
        }
        else {
            await this.prisma.$transaction([
                this.prisma.postLike.create({
                    data: {
                        postId,
                        memberId,
                    },
                }),
                this.prisma.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: {
                            increment: 1,
                        },
                    },
                }),
            ]);
            if (post.authorId !== memberId) {
                await this.createLikeNotification(postId, memberId, post.authorId);
            }
            return { liked: true, message: 'Post liked' };
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
    async validateFamilyAccess(memberId, familyId) {
        const membership = await this.prisma.familyMembership.findUnique({
            where: {
                memberId_familyId: {
                    memberId,
                    familyId,
                },
            },
        });
        if (!membership || !membership.isActive) {
            throw new common_1.ForbiddenException('You do not have access to this family');
        }
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
    async createNewPostNotifications(postId, authorId, familyId) {
        let familyMemberIds = [];
        if (familyId) {
            const memberships = await this.prisma.familyMembership.findMany({
                where: {
                    familyId,
                    isActive: true,
                    memberId: { not: authorId },
                },
                select: { memberId: true },
            });
            familyMemberIds = memberships.map(m => m.memberId);
        }
        else {
            const authorFamilies = await this.getMemberFamilyIds(authorId);
            const memberships = await this.prisma.familyMembership.findMany({
                where: {
                    familyId: { in: authorFamilies },
                    isActive: true,
                    memberId: { not: authorId },
                },
                select: { memberId: true },
            });
            familyMemberIds = [...new Set(memberships.map(m => m.memberId))];
        }
        const notifications = familyMemberIds.map(memberId => ({
            type: 'NEW_POST',
            message: 'shared a new post',
            memberId,
            relatedPostId: postId,
            relatedMemberId: authorId,
        }));
        if (notifications.length > 0) {
            await this.prisma.notification.createMany({
                data: notifications,
            });
        }
    }
    async createLikeNotification(postId, likerId, postAuthorId) {
        await this.prisma.notification.create({
            data: {
                type: 'POST_LIKE',
                message: 'liked your post',
                memberId: postAuthorId,
                relatedPostId: postId,
                relatedMemberId: likerId,
            },
        });
    }
};
exports.PostService = PostService;
exports.PostService = PostService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostService);
//# sourceMappingURL=post.service.js.map