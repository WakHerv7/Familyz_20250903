"use client";

import Navigation from "@/components/Navigation";
import NotificationPanel from "@/components/NotificationPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Activity, Users, Heart, MessageCircle } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/api";

export default function NotificationsPage() {
  const { data: unreadCountData } = useUnreadNotificationCount();
  const unreadCount = unreadCountData?.unreadCount || 0;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Notifications
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    Stay connected with your family's latest activities
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="destructive"
                    className="px-3 py-1 text-sm font-semibold"
                  >
                    {unreadCount} new
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold">{unreadCount}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Likes</p>
                    <p className="text-2xl font-bold">--</p>
                  </div>
                  <Heart className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Comments
                    </p>
                    <p className="text-2xl font-bold">--</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Family
                    </p>
                    <p className="text-2xl font-bold">--</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Notification Panel */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <NotificationPanel />
          </div>
        </div>
      </main>
    </>
  );
}
