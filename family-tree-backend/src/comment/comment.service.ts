import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto/comment.dto';
import { PostVisibility } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createComment(postId: string, authorId: string, createCommentDto: CreateCommentDto) {
    // Verify post exists and user has access
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.validatePostAccess(post, authorId);

    // Verify parent comment exists if provided
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentCommentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
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

    // Create notification if not commenting on own post
    if (post.authorId !== authorId) {
      await this.createCommentNotification(postId, comment.id, authorId, post.authorId);
    }

    return {
      ...comment,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
    };
  }

  async getCommentsByPost(postId: string, currentMemberId: string, query: CommentQueryDto) {
    const { page = 1, limit = 20, includeReplies = true } = query;
    const skip = (page - 1) * limit;

    // Verify post access
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.validatePostAccess(post, currentMemberId);

    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null, // Only top-level comments
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

  async updateComment(commentId: string, currentMemberId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== currentMemberId) {
      throw new ForbiddenException('You can only edit your own comments');
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

  async deleteComment(commentId: string, currentMemberId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== currentMemberId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete comment and all replies
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
  }

  async likeComment(commentId: string, memberId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Verify post access
    await this.validatePostAccess(comment.post, memberId);

    // Check if already liked
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_memberId: {
          commentId,
          memberId,
        },
      },
    });

    if (existingLike) {
      // Unlike
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
    } else {
      // Like
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

      // Create notification if not own comment
      if (comment.authorId !== memberId) {
        await this.createCommentLikeNotification(commentId, memberId, comment.authorId);
      }

      return { liked: true, message: 'Comment liked' };
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

    if (post.visibility === PostVisibility.SUBFAMILY) {
      // Implement sub-family specific logic here
      const authorFamilies = await this.getMemberFamilyIds(post.authorId);
      const hasCommonFamily = memberFamilies.some(fId => authorFamilies.includes(fId));

      if (!hasCommonFamily) {
        throw new ForbiddenException('You do not have access to this post');
      }
    }
  }

  private async createCommentNotification(postId: string, commentId: string, commenterId: string, postAuthorId: string) {
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

  private async createCommentLikeNotification(commentId: string, likerId: string, commentAuthorId: string) {
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
}
