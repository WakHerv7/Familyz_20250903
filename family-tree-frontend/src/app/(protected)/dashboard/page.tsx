"use client";

import { useState } from "react";
import { useAppSelector } from "@/hooks/redux";
import { useProfileFromStore, useUnreadNotificationCount } from "@/hooks/api";
import { MemberWithRelationships } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";
import NotificationPanel from "@/components/NotificationPanel";
import AddFamilyMemberDialog from "@/components/dialogs/AddFamilyMemberDialog";
import InviteOthersDialog from "@/components/dialogs/InviteOthersDialog";
import SettingsDialog from "@/components/dialogs/SettingsDialog";
import {
  Settings,
  UserPlus,
  Mail,
  MessagesSquare,
  GitBranch,
  Users,
  Heart,
  Calendar,
  TrendingUp,
  Activity,
  Star,
  TreePine,
  Plus,
  ArrowRight,
  Bell,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useProfileFromStore();
  const { data: unreadCount } = useUnreadNotificationCount();

  const [showAddMember, setShowAddMember] = useState(false);
  const [showInviteOthers, setShowInviteOthers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check if current user is admin
  const isAdmin =
    profile?.familyMemberships?.some(
      (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
    ) || false;

  const handleRelationshipChange = () => {
    // Refetch profile to update relationships
    // refetchProfile();
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Hero Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <TreePine className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Welcome back,{" "}
                    {profile?.name || user?.email?.split("@")[0] || "User"}! 👋
                  </h1>
                  <p className="text-green-100 mt-1">
                    Let's explore your family connections and create lasting
                    memories
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Family Members
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {profile?.familyMemberships?.length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Active Families
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {profile?.familyMemberships?.filter(
                        (m) => m.role !== "MEMBER"
                      ).length || 0}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Notifications
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {unreadCount?.unreadCount || 0}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      Member Since
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {profile
                        ? new Date(profile.createdAt).getFullYear()
                        : "2025"}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Jump into your family activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => (window.location.href = "/social")}
                  disabled={!profile}
                >
                  <MessagesSquare className="h-7 w-7" />
                  <span className="font-medium">Social Feed</span>
                </Button>

                <Button
                  className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => (window.location.href = "/tree")}
                  disabled={!profile}
                >
                  <GitBranch className="h-7 w-7" />
                  <span className="font-medium">Family Tree</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                  onClick={() => setShowAddMember(true)}
                >
                  <Plus className="h-7 w-7 text-gray-400" />
                  <span className="font-medium text-gray-600">Add Member</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => setShowInviteOthers(true)}
                >
                  <Mail className="h-7 w-7 text-gray-400" />
                  <span className="font-medium text-gray-600">
                    Invite Family
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile & Family Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>My Profile</span>
                  </CardTitle>
                  <CardDescription>
                    Your family tree profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Full Name</p>
                          <p className="font-medium text-lg">{profile.name}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Gender</p>
                          <p className="font-medium">
                            {profile.gender || "Not specified"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-medium">{profile.status}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium">
                            {new Date(profile.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-green-200 hover:bg-green-50"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile Settings
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Loading profile...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Family Memberships */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Family Memberships</span>
                  </CardTitle>
                  <CardDescription>Families you belong to</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.familyMemberships &&
                  profile.familyMemberships.length > 0 ? (
                    <div className="space-y-4">
                      {profile.familyMemberships.map((membership) => (
                        <div
                          key={membership.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-lg">
                                {membership.familyName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Role:{" "}
                                <span className="font-medium">
                                  {membership.role}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500">
                                Joined:{" "}
                                {new Date(
                                  membership.joinDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                membership.role === "ADMIN" ||
                                membership.role === "HEAD"
                                  ? "default"
                                  : "secondary"
                              }
                              className="ml-4"
                            >
                              {membership.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        No family memberships found
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowInviteOthers(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Join or Create Family
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Recent Activity</span>
                    </div>
                    {unreadCount && unreadCount.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {unreadCount.unreadCount} new
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Latest family updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationPanel showOnlyUnread={true} maxHeight="300px" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => (window.location.href = "/notifications")}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    View All Notifications
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <Star className="h-5 w-5" />
                    <span>Quick Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        1
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Add family members to build your complete family tree
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        2
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Use the social feed to share memories with your family
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        3
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Export your family data as PDF or Excel anytime
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <AddFamilyMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
      />

      <InviteOthersDialog
        open={showInviteOthers}
        onOpenChange={setShowInviteOthers}
      />

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
