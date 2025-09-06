"use client";

import { useProfile, useFamilies } from "@/hooks/api";
import { MemberWithRelationships } from "@/types";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";
import InteractiveFamilyTree from "@/components/InteractiveFamilyTree";
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
  Users,
  Network,
  Eye,
  TrendingUp,
  Plus,
  UserPlus,
  Settings,
  Calendar,
  TreePine,
  Activity,
  Star,
  Heart,
  Zap,
  MousePointer,
  ZoomIn,
  Download,
} from "lucide-react";

export default function InteractivePage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userFamilies } = useFamilies();

  const handleMemberClick = (member: MemberWithRelationships | string) => {
    // Could navigate to member details or show in modal
    const memberId = typeof member === "string" ? member : member.id;
    console.log("Member clicked:", memberId);
  };

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
              Please complete your profile to view the interactive tree.
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
          {/* bg-gradient-to-r from-orange-600 to-red-600 */}
          {/* bg-gradient-to-r from-green-600 to-teal-600 */}
          {/* bg-gradient-to-r from-green-600 to-green-700 */}
          {/* bg-gradient-to-r from-purple-600 to-pink-600 */}
          <div className="bg-gradient-to-r from-green-600 to-orange-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Network className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Interactive Family Tree 🌳
                  </h1>
                  <p className="text-purple-100 mt-1">
                    Explore your family connections with advanced interactive
                    features and stunning visualizations
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
            <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Family Members
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {profile?.familyMemberships?.length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Tree Views
                    </p>
                    <p className="text-2xl font-bold text-blue-900">3</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Generations
                    </p>
                    <p className="text-2xl font-bold text-green-900">∞</p>
                  </div>
                  <TreePine className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            {/* Interactive Family Tree */}
            <div className="">
              {/* <Card className="bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Network className="h-5 w-5 text-purple-600" />
                    <span>Interactive Family Tree</span>
                  </CardTitle>
                  <CardDescription>
                    Advanced visualization with multiple view modes and
                    interactive features
                  </CardDescription>
                </CardHeader>
                <CardContent> */}
              <InteractiveFamilyTree
                currentMember={profile}
                onMemberClick={handleMemberClick}
              />
              {/* </CardContent>
              </Card> */}
            </div>

            {/* Sidebar */}
            {/* <div className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-800">
                    <Zap className="h-5 w-5" />
                    <span>Tree Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Family Member
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Tree
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Tree Settings
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Activity className="h-5 w-5" />
                    <span>Interactive Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-200 rounded-full p-2">
                      <MousePointer className="h-3 w-3 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Click to Explore</p>
                      <p className="text-xs text-gray-500">
                        Click any node for details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-200 rounded-full p-2">
                      <ZoomIn className="h-3 w-3 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Zoom & Pan</p>
                      <p className="text-xs text-gray-500">
                        Navigate large trees easily
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-200 rounded-full p-2">
                      <Network className="h-3 w-3 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Multiple Views</p>
                      <p className="text-xs text-gray-500">
                        Switch between layouts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <Star className="h-5 w-5" />
                    <span>Pro Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        🎯
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Use the explorer view for complete family navigation
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        🎨
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Try different view modes to find your preferred layout
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        📱
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Export your tree as SVG for high-quality sharing
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <TrendingUp className="h-5 w-5" />
                    <span>Family Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">
                      Total Members
                    </span>
                    <Badge variant="secondary">
                      {profile?.familyMemberships?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">
                      Active Families
                    </span>
                    <Badge variant="secondary">
                      {userFamilies?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Connections</span>
                    <Badge variant="secondary">∞</Badge>
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>
      </main>
    </>
  );
}
