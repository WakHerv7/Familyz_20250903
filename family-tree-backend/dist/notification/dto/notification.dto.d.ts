import { NotificationType } from '@prisma/client';
export declare class NotificationQueryDto {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
}
export declare class MarkNotificationReadDto {
    isRead: boolean;
}
export declare class NotificationResponseDto {
    id: string;
    type: NotificationType;
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedMember?: {
        id: string;
        name: string;
        personalInfo: any;
    };
    relatedPost?: {
        id: string;
        content: string;
    };
    relatedComment?: {
        id: string;
        content: string;
    };
    metadata?: any;
}
