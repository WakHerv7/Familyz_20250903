"use client";

import { useProfile } from "@/hooks/api";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";
import SocialFeed from "@/components/SocialFeed";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessagesSquare,
  Users,
  Heart,
  TrendingUp,
  Plus,
  Users2,
  MessageCircle,
  ThumbsUp,
  Share,
  Calendar,
  TreePine,
  Activity,
  Sparkles,
  Camera,
  Gift,
  Bell,
  Star,
  Home,
  UserPlus,
  Image,
  Video,
  Smile,
} from "lucide-react";

export default function SocialPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Check if current user is admin
  const isAdmin =
    profile?.familyMemberships?.some(
      (membership) => membership.role === "ADMIN" || membership.role === "HEAD"
    ) || false;

  if (profileLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-12">
          <ClipLoader size={32} color="#3B82F6" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Profile Required
            </h2>
            <p className="text-gray-600">
              Please complete your profile to access the social feed.
            </p>
          </div>
        </div>
      </>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Modern Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                        <Home className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                        <Sparkles className="h-3 w-3 text-yellow-900" />
                      </div>
                    </div>
                    <div className="text-white">
                      <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        Family Feed
                      </h1>
                      <p className="text-lg text-white/90 max-w-md">
                        Share precious moments, celebrate milestones, and stay
                        connected with your loved ones
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
                      <div className="flex items-center space-x-2 text-white">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">
                          {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Avatar className="ring-4 ring-white/20">
                        {profile?.personalInfo?.profileImage ? (
                          <img
                            src={profile.personalInfo.profileImage}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-white/20 text-white font-bold">
                            {getInitials(profile?.name || "U")}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-white">
                        <p className="font-semibold">
                          Welcome back, {profile?.name?.split(" ")[0]}!
                        </p>
                        <p className="text-sm text-white/80">
                          Ready to share some love? 💕
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        Family Members
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {profile?.familyMemberships?.length || 0}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        Active Families
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {profile?.familyMemberships?.filter(
                          (m) => m.role !== "MEMBER"
                        ).length || 0}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <TreePine className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        Posts Today
                      </p>
                      <p className="text-2xl font-bold text-white">0</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-rose-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm font-medium">
                        Memories
                      </p>
                      <p className="text-2xl font-bold text-white">∞</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Social Feed - Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            Latest Updates
                          </h2>
                          <p className="text-gray-600 text-sm">
                            Fresh from your family circle
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Live Feed
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <SocialFeed isAdmin={isAdmin} />
                  </div>
                </div>
              </div>

              {/* Enhanced Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-orange-50 to-pink-50 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-orange-800">
                      <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-2 rounded-lg">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold">Quick Share</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      New Post
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-orange-200 hover:bg-orange-50 transition-all duration-300"
                    >
                      <Users2 className="h-4 w-4 mr-2" />
                      Tag Family
                      <UserPlus className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-pink-200 hover:bg-pink-50 transition-all duration-300"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Share Memory
                      <Heart className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Family Activity */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold">Family Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-2 rounded-full">
                        <ThumbsUp className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          Sarah liked your post
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-full">
                        <MessageCircle className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          New comment on photo
                        </p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-2 rounded-full">
                        <Share className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          Mike shared a memory
                        </p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Family Tips */}
                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-yellow-800">
                      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-2 rounded-lg">
                        <TreePine className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold">Family Tips</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300">
                      <div className="bg-gradient-to-r from-pink-400 to-rose-500 p-2 rounded-full">
                        <span className="text-sm">💝</span>
                      </div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Share photos from family gatherings to create lasting
                        memories
                      </p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300">
                      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-2 rounded-full">
                        <span className="text-sm">👨‍👩‍👧‍👦</span>
                      </div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Tag family members in posts to keep everyone connected
                      </p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-2 rounded-full">
                        <span className="text-sm">🎉</span>
                      </div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Celebrate birthdays and anniversaries with special posts
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Celebrations */}
                <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-rose-800">
                      <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-2 rounded-lg">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold">Celebrations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-4 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg">
                      <div className="text-2xl mb-2">🎂</div>
                      <p className="text-sm font-semibold text-rose-800">
                        Mom's Birthday
                      </p>
                      <p className="text-xs text-rose-600">Tomorrow</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                      <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                      <p className="text-sm font-semibold text-blue-800">
                        Family Reunion
                      </p>
                      <p className="text-xs text-blue-600">Next Week</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
