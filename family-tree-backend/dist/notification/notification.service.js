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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotifications(memberId, query) {
        const { page = 1, limit = 20, isRead, type } = query;
        const skip = (page - 1) * limit;
        const whereClause = {
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
        const enrichedNotifications = await Promise.all(notifications.map(async (notification) => {
            const enriched = {
                ...notification,
                relatedMember: notification.relatedMember,
            };
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
        }));
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
    async markNotificationRead(notificationId, memberId, markReadDto) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                memberId,
            },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: markReadDto.isRead,
            },
        });
    }
    async markAllNotificationsRead(memberId) {
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
    async deleteNotification(notificationId, memberId) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                memberId,
            },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        await this.prisma.notification.delete({
            where: { id: notificationId },
        });
        return { message: 'Notification deleted successfully' };
    }
    async getUnreadCount(memberId) {
        const count = await this.prisma.notification.count({
            where: {
                memberId,
                isRead: false,
            },
        });
        return { unreadCount: count };
    }
    async deleteAllReadNotifications(memberId) {
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
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map