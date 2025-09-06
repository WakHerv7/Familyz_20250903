"use client";

import { useProfile } from "@/hooks/api";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";
import FamilyTree from "@/components/FamilyTree";
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
  GitBranch,
  Users,
  Heart,
  TrendingUp,
  Plus,
  Users2,
  UserPlus,
  Calendar,
  TreePine,
  Network,
  Eye,
  Settings,
} from "lucide-react";

export default function TreePage() {
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useProfile();

  const handleRelationshipChange = () => {
    // Refetch profile to update relationships
    refetchProfile();
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
              Please complete your profile to view the family tree.
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
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <GitBranch className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Family Tree Explorer 🌳
                  </h1>
                  <p className="text-green-100 mt-1">
                    Discover your family roots and explore generations of
                    connections
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
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Family Members
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {profile?.familyMemberships?.length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Generations
                    </p>
                    <p className="text-2xl font-bold text-blue-900">3+</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Connections
                    </p>
                    <p className="text-2xl font-bold text-purple-900">∞</p>
                  </div>
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            {/* Family Tree */}
            <div className="">
              {/* <Card className="bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TreePine className="h-5 w-5 text-green-600" />
                    <span>Your Family Tree</span>
                  </CardTitle>
                  <CardDescription>
                    Interactive visualization of your family connections
                  </CardDescription>
                </CardHeader>
                <CardContent> */}
              <FamilyTree
                currentMember={profile}
                onRelationshipChange={handleRelationshipChange}
              />
              {/* </CardContent>
              </Card> */}
            </div>

            {/* Sidebar */}
            {/* <div className="space-y-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Plus className="h-5 w-5" />
                    <span>Tree Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Family Member
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
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
                    <TrendingUp className="h-5 w-5" />
                    <span>Tree Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Total Members</span>
                    <Badge variant="secondary">
                      {profile?.familyMemberships?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Generations</span>
                    <Badge variant="secondary">3+</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Relationships</span>
                    <Badge variant="secondary">∞</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <TreePine className="h-5 w-5" />
                    <span>Tree Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        👆
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Click on any family member to see their details
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        🔍
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Use zoom and pan to navigate large family trees
                    </p>
                  </div>
                </CardContent>
              </Card> 
            </div>*/}
          </div>
        </div>
      </main>
    </>
  );
}
