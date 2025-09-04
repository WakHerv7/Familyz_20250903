'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification
} from '@/hooks/api';
import { Notification, NotificationType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClipLoader } from 'react-spinners';
import {
  Bell,
  Heart,
  MessageCircle,
  FileText,
  Users,
  Check,
  CheckCheck,
  Trash2,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  showOnlyUnread?: boolean;
  maxHeight?: string;
}

export default function NotificationPanel({ showOnlyUnread = false, maxHeight = "400px" }: NotificationPanelProps) {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const { data: notificationsData, isLoading } = useNotifications({
    isRead: showOnlyUnread ? false : undefined,
    type: filter === 'all' ? undefined : filter,
    limit: 20,
  });

  const { data: unreadCountData } = useUnreadNotificationCount();
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.POST_LIKE:
        return <Heart className="h-4 w-4 text-red-500" />;
      case NotificationType.COMMENT_LIKE:
        return <Heart className="h-4 w-4 text-red-500" />;
      case NotificationType.NEW_COMMENT:
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case NotificationType.NEW_POST:
        return <FileText className="h-4 w-4 text-green-500" />;
      case NotificationType.MENTION:
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.POST_LIKE:
        return 'Post Like';
      case NotificationType.COMMENT_LIKE:
        return 'Comment Like';
      case NotificationType.NEW_COMMENT:
        return 'New Comment';
      case NotificationType.NEW_POST:
        return 'New Post';
      case NotificationType.MENTION:
        return 'Mention';
      default:
        return 'Notification';
    }
  };

  const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
    try {
      await markNotificationRead.mutateAsync({ notificationId, isRead: !isRead });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    const relatedMember = notification.relatedMember;

    return (
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {relatedMember ? getInitials(relatedMember.name) : '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">
                  {relatedMember?.name || 'Someone'}
                </span>{' '}
                <span className="text-gray-600">{notification.message}</span>
              </p>

              {notification.relatedPost && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  "{notification.relatedPost.content.substring(0, 60)}..."
                </p>
              )}

              {notification.relatedComment && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  Comment: "{notification.relatedComment.content.substring(0, 60)}..."
                </p>
              )}

              <div className="flex items-center space-x-2 mt-1">
                {getNotificationIcon(notification.type)}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
              >
                {notification.isRead ? (
                  <CheckCheck className="h-3 w-3 text-green-500" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={() => handleDeleteNotification(notification.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? NotificationType.POST_LIKE : 'all')}
            >
              <Filter className="h-4 w-4" />
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllNotificationsRead.isPending}
              >
                {markAllNotificationsRead.isPending ? (
                  <ClipLoader size={12} color="currentColor" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === NotificationType.POST_LIKE ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(NotificationType.POST_LIKE)}
          >
            Likes
          </Button>
          <Button
            variant={filter === NotificationType.NEW_COMMENT ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(NotificationType.NEW_COMMENT)}
          >
            Comments
          </Button>
          <Button
            variant={filter === NotificationType.NEW_POST ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(NotificationType.NEW_POST)}
          >
            Posts
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div
          className="space-y-3 overflow-y-auto"
          style={{ maxHeight }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <ClipLoader size={24} color="#3B82F6" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  notification.isRead
                    ? "bg-gray-50 border-gray-200"
                    : "bg-blue-50 border-blue-200"
                )}
              >
                {renderNotificationContent(notification)}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs">
                {showOnlyUnread
                  ? "You're all caught up!"
                  : "You'll see new activity here"
                }
              </p>
            </div>
          )}
        </div>

        {notifications.length > 0 && notificationsData?.pagination &&
         notificationsData.pagination.pages > 1 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-center">
              <Button variant="outline" size="sm">
                Load more notifications
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
