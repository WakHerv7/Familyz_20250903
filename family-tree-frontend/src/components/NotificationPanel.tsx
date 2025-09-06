"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/api";
import { Notification, NotificationType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipLoader } from "react-spinners";
import {
  Bell,
  Heart,
  MessageCircle,
  FileText,
  Users,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  showOnlyUnread?: boolean;
  maxHeight?: string;
}

export default function NotificationPanel({
  showOnlyUnread = false,
  maxHeight = "400px",
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  const { data: notificationsData, isLoading } = useNotifications({
    isRead: showOnlyUnread ? false : undefined,
    type: filter === "all" ? undefined : filter,
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
      .split(" ")
      .map((n) => n[0])
      .join("")
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
        return "Post Like";
      case NotificationType.COMMENT_LIKE:
        return "Comment Like";
      case NotificationType.NEW_COMMENT:
        return "New Comment";
      case NotificationType.NEW_POST:
        return "New Post";
      case NotificationType.MENTION:
        return "Mention";
      default:
        return "Notification";
    }
  };

  const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
    try {
      await markNotificationRead.mutateAsync({
        notificationId,
        isRead: !isRead,
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead.mutateAsync();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification.mutateAsync(notificationId);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    const relatedMember = notification.relatedMember;

    return (
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {relatedMember ? getInitials(relatedMember.name) : "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">
                  {relatedMember?.name || "Someone"}
                </span>{" "}
                <span className="text-gray-600">{notification.message}</span>
              </p>

              {notification.relatedPost && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  "{notification.relatedPost.content.substring(0, 60)}..."
                </p>
              )}

              {notification.relatedComment && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  Comment: "
                  {notification.relatedComment.content.substring(0, 60)}..."
                </p>
              )}

              <div className="flex items-center space-x-2 mt-1">
                {getNotificationIcon(notification.type)}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  handleMarkAsRead(notification.id, notification.isRead)
                }
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

  const renderNotificationCard = (notification: Notification) => {
    const relatedMember = notification.relatedMember;

    return (
      <div
        key={notification.id}
        className={cn(
          "group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md cursor-pointer",
          notification.isRead
            ? "bg-white border-gray-200 hover:border-gray-300"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-100"
        )}
      >
        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
        )}

        <div className="flex items-start space-x-4">
          {/* Avatar with notification type indicator */}
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {relatedMember ? getInitials(relatedMember.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
              {getNotificationIcon(notification.type)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-gray-900">
                    {relatedMember?.name || "Someone"}
                  </span>{" "}
                  <span className="text-gray-700">{notification.message}</span>
                </p>

                {notification.relatedPost && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border-l-2 border-gray-200">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      "{notification.relatedPost.content.substring(0, 80)}..."
                    </p>
                  </div>
                )}

                {notification.relatedComment && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border-l-2 border-gray-200">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      Comment: "
                      {notification.relatedComment.content.substring(0, 80)}..."
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id, notification.isRead);
                      }}
                    >
                      {notification.isRead ? (
                        <EyeOff className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Eye className="h-3 w-3 text-blue-500" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = (
    message: string,
    subMessage: string,
    icon: React.ReactNode
  ) => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{subMessage}</p>
    </div>
  );

  return (
    <div className="w-full">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6 px-6 pt-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Activity Feed</h2>
            <p className="text-sm text-gray-600">
              Stay updated with your family
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllNotificationsRead.isPending}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {markAllNotificationsRead.isPending ? (
              <ClipLoader size={14} color="currentColor" />
            ) : (
              <>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-6 mb-4 bg-gray-100">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>All</span>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center space-x-2">
            <span>Unread</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="px-6 pb-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <ClipLoader size={32} color="#3B82F6" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) =>
                renderNotificationCard(notification)
              )
            ) : (
              renderEmptyState(
                "No notifications yet",
                "When your family members interact with posts, you'll see activity here.",
                <Bell className="h-8 w-8 text-gray-400" />
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread" className="px-6 pb-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <ClipLoader size={32} color="#3B82F6" />
              </div>
            ) : notifications.filter((n) => !n.isRead).length > 0 ? (
              notifications
                .filter((notification) => !notification.isRead)
                .map((notification) => renderNotificationCard(notification))
            ) : (
              renderEmptyState(
                "All caught up! 🎉",
                "You've read all your notifications. New activity will appear here.",
                <CheckCheck className="h-8 w-8 text-green-500" />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
