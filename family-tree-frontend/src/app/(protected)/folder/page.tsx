"use client";

import { useProfileFromStore } from "@/hooks/api";
import { MemberWithRelationships } from "@/types";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";
import FolderTreeView from "@/components/FolderTreeView";
import AuthGuard from "@/components/AuthGuard";
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
  Folder,
  Users,
  Heart,
  TrendingUp,
  Plus,
  Users2,
  UserPlus,
  Calendar,
  TreePine,
  FileText,
  Download,
  Eye,
  Settings,
} from "lucide-react";

export default function FolderPage() {
  const { profile } = useProfileFromStore();

  // Check if current user is admin
  const isAdmin =
    profile?.familyMemberships?.some(
      (membership: any) =>
        membership.role === "ADMIN" || membership.role === "HEAD"
    ) || false;

  const handleMemberClick = (member: MemberWithRelationships | string) => {
    // Could navigate to member details or show in modal
    const memberId = typeof member === "string" ? member : member.id;
    console.log("Member clicked:", memberId);
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Hero Section */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Folder className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Folder Tree Explorer 📁
                  </h1>
                  <p className="text-orange-100 mt-1">
                    Navigate your family tree like a file system with expandable
                    folders
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
            <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      Family Branches
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {profile?.familyMemberships?.length || 0}
                    </p>
                  </div>
                  <Folder className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Nested Levels
                    </p>
                    <p className="text-2xl font-bold text-blue-900">∞</p>
                  </div>
                  <TreePine className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-teal-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Export Ready
                    </p>
                    <p className="text-2xl font-bold text-green-900">✓</p>
                  </div>
                  <Download className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Folder Tree */}
            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Folder className="h-5 w-5 text-orange-600" />
                    <span>Family Folder Structure</span>
                  </CardTitle>
                  <CardDescription>
                    Click folders to expand and explore your family tree
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile && (
                    <FolderTreeView
                      currentMember={profile}
                      isAdmin={isAdmin}
                      onMemberClick={handleMemberClick}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-800">
                    <Plus className="h-5 w-5" />
                    <span>Folder Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Family Member
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Member Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Folder Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Download className="h-5 w-5" />
                    <span>Export Options</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export as Excel
                  </Button>
                  <p className="text-xs text-green-700 mt-2">
                    Exports use textTree format for best readability
                  </p>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <Folder className="h-5 w-5" />
                    <span>Navigation Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        📂
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Click folder icons to expand/collapse branches
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-200 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-yellow-800 font-bold">
                        👤
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Click on names to view detailed member information
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
