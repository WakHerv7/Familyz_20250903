import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto/post.dto';
import { PostVisibility, FamilyRole } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async createPost(authorId: string, createPostDto: CreatePostDto) {
    // Validate family access if familyId is provided
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

    // Create notification for family members
    if (createPostDto.visibility !== PostVisibility.PUBLIC) {
      await this.createNewPostNotifications(post.id, authorId, createPostDto.familyId);
    }

    return {
      ...post,
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
    };
  }

  async getPosts(currentMemberId: string, query: PostQueryDto) {
    const { page = 1, limit = 10, familyId, visibility, authorId } = query;
    const skip = (page - 1) * limit;

    // Get current member's family memberships for privacy filtering
    const memberFamilies = await this.getMemberFamilyIds(currentMemberId);

    // Build where clause with privacy logic
    const whereClause: any = {
      OR: [
        { visibility: PostVisibility.PUBLIC },
        {
          AND: [
            { visibility: PostVisibility.FAMILY },
            {
              OR: [
                { authorId: currentMemberId }, // Own posts
                { familyId: { in: memberFamilies } }, // Family posts
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

    // Apply additional filters
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
      likes: undefined, // Remove likes array from response
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

  async getPostById(postId: string, currentMemberId: string) {
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
          where: { parentCommentId: null }, // Only top-level comments
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
      throw new NotFoundException('Post not found');
    }

    // Check privacy access
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

  async updatePost(postId: string, currentMemberId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== currentMemberId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    // Add to edit history
    const currentHistory = post.editHistory as any || {};
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

  async deletePost(postId: string, currentMemberId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== currentMemberId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }

  async likePost(postId: string, memberId: string) {
    // Check if post exists and user has access
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.validatePostAccess(post, memberId);

    // Check if already liked
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_memberId: {
          postId,
          memberId,
        },
      },
    });

    if (existingLike) {
      // Unlike
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
    } else {
      // Like
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

      // Create notification if not own post
      if (post.authorId !== memberId) {
        await this.createLikeNotification(postId, memberId, post.authorId);
      }

      return { liked: true, message: 'Post liked' };
    }
  }

  // Helper methods
  private async getMemberFamilyIds(memberId: string): Promise<string[]> {
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

  private async validateFamilyAccess(memberId: string, familyId: string) {
    const membership = await this.prisma.familyMembership.findUnique({
      where: {
        memberId_familyId: {
          memberId,
          familyId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You do not have access to this family');
    }
  }

  private async validatePostAccess(post: any, currentMemberId: string) {
    if (post.visibility === PostVisibility.PUBLIC) {
      return; // Public posts are accessible to everyone
    }

    if (post.authorId === currentMemberId) {
      return; // Own posts are always accessible
    }

    const memberFamilies = await this.getMemberFamilyIds(currentMemberId);

    if (post.visibility === PostVisibility.FAMILY) {
      // Check if post is family-specific
      if (post.familyId && !memberFamilies.includes(post.familyId)) {
        throw new ForbiddenException('You do not have access to this post');
      }

      // Check if author is in same family
      const authorFamilies = await this.getMemberFamilyIds(post.authorId);
      const hasCommonFamily = memberFamilies.some(fId => authorFamilies.includes(fId));

      if (!hasCommonFamily) {
        throw new ForbiddenException('You do not have access to this post');
      }
    }

    // Add more privacy logic for SUBFAMILY visibility
    if (post.visibility === PostVisibility.SUBFAMILY) {
      // Implement sub-family specific logic here
      // For now, treat same as FAMILY
      const authorFamilies = await this.getMemberFamilyIds(post.authorId);
      const hasCommonFamily = memberFamilies.some(fId => authorFamilies.includes(fId));

      if (!hasCommonFamily) {
        throw new ForbiddenException('You do not have access to this post');
      }
    }
  }

  private async createNewPostNotifications(postId: string, authorId: string, familyId?: string) {
    // Get family members to notify
    let familyMemberIds: string[] = [];

    if (familyId) {
      const memberships = await this.prisma.familyMembership.findMany({
        where: {
          familyId,
          isActive: true,
          memberId: { not: authorId }, // Don't notify the author
        },
        select: { memberId: true },
      });
      familyMemberIds = memberships.map(m => m.memberId);
    } else {
      // Notify all family members of the author
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

    // Create notifications
    const notifications = familyMemberIds.map(memberId => ({
      type: 'NEW_POST' as const,
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

  private async createLikeNotification(postId: string, likerId: string, postAuthorId: string) {
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
}
