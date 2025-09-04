import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto, MarkNotificationReadDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(memberId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, isRead, type } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      memberId,
    };

    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    if (type) {
      whereClause.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          relatedMember: {
            select: {
              id: true,
              name: true,
              personalInfo: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where: whereClause }),
      this.prisma.notification.count({
        where: {
          memberId,
          isRead: false,
        },
      }),
    ]);

    // Enrich notifications with related data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const enriched: any = {
          ...notification,
          relatedMember: notification.relatedMember,
        };

        // Add related post data if exists
        if (notification.relatedPostId) {
          const post = await this.prisma.post.findUnique({
            where: { id: notification.relatedPostId },
            select: {
              id: true,
              content: true,
            },
          });
          enriched.relatedPost = post;
        }

        // Add related comment data if exists
        if (notification.relatedCommentId) {
          const comment = await this.prisma.comment.findUnique({
            where: { id: notification.relatedCommentId },
            select: {
              id: true,
              content: true,
            },
          });
          enriched.relatedComment = comment;
        }

        return enriched;
      })
    );

    return {
      notifications: enrichedNotifications,
      pagination: {
        current: page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markNotificationRead(notificationId: string, memberId: string, markReadDto: MarkNotificationReadDto) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        memberId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: markReadDto.isRead,
      },
    });
  }

  async markAllNotificationsRead(memberId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        memberId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    };
  }

  async deleteNotification(notificationId: string, memberId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        memberId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  async getUnreadCount(memberId: string) {
    const count = await this.prisma.notification.count({
      where: {
        memberId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async deleteAllReadNotifications(memberId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        memberId,
        isRead: true,
      },
    });

    return {
      message: `Deleted ${result.count} read notifications`,
      count: result.count,
    };
  }
}
