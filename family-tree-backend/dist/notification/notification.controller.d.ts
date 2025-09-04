import { NotificationService } from './notification.service';
import { NotificationQueryDto, MarkNotificationReadDto } from './dto/notification.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getNotifications(memberId: string, query: NotificationQueryDto): Promise<{
        notifications: any[];
        pagination: {
            current: number;
            limit: number;
            total: number;
            pages: number;
        };
        unreadCount: number;
    }>;
    getUnreadCount(memberId: string): Promise<{
        unreadCount: number;
    }>;
    markNotificationRead(notificationId: string, memberId: string, markReadDto: MarkNotificationReadDto): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        message: string;
        id: string;
        createdAt: Date;
        memberId: string;
        relatedMemberId: string | null;
        relatedPostId: string | null;
        isRead: boolean;
        relatedCommentId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    markAllNotificationsRead(memberId: string): Promise<{
        message: string;
        count: number;
    }>;
    deleteNotification(notificationId: string, memberId: string): Promise<{
        message: string;
    }>;
    deleteAllReadNotifications(memberId: string): Promise<{
        message: string;
        count: number;
    }>;
}
