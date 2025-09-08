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

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Hero Section */}
          {/* bg-gradient-to-r from-blue-600 to-purple-600 */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <MessagesSquare className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Family Social Feed 🏠</h1>
                  <p className="text-blue-100 mt-1">
                    Share memories, connect with loved ones, and stay updated
                    with family news
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
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Family Connections
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
                      Posts Today
                    </p>
                    <p className="text-2xl font-bold text-purple-900">0</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Social Feed */}
            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Latest Updates</span>
                  </CardTitle>
                  <CardDescription>
                    Recent posts and activities from your family
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SocialFeed isAdmin={isAdmin} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Plus className="h-5 w-5" />
                    <span>Quick Share</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users2 className="h-4 w-4 mr-2" />
                    Tag Family
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Share Memory
                  </Button>
                </CardContent>
              </Card>

              {/* Family Activity */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Activity className="h-5 w-5" />
                    <span>Family Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-200 rounded-full p-2">
                      <ThumbsUp className="h-3 w-3 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Sarah liked your post
                      </p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-200 rounded-full p-2">
                      <MessageCircle className="h-3 w-3 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        New comment on photo
                      </p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-200 rounded-full p-2">
                      <Share className="h-3 w-3 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Mike shared a memory
                      </p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <TreePine className="h-5 w-5" />
                    <span>Family Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        💝
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Share photos from family gatherings to create lasting
                      memories
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        👨‍👩‍👧‍👦
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Tag family members in posts to keep everyone connected
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
