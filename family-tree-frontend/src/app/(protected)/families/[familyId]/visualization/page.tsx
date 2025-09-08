"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFamily, useProfileFromStore, useFamilyTree } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import {
  Users,
  FolderTree,
  Network,
  GitBranch,
  ArrowLeft,
  Settings,
  Download,
  Share,
} from "lucide-react";
import FamilyFolderTreeView from "@/components/family-visualization/FamilyFolderTreeView";
import FamilyTree from "@/components/FamilyTree";
import FamilySvgTreeView from "@/components/family-visualization/FamilySvgTreeView";
import FamilyHierarchicalView from "@/components/family-visualization/FamilyHierarchicalView";
import FamilyForceDirectedView from "@/components/family-visualization/FamilyForceDirectedView";
import { useAppSelector } from "@/hooks/redux";

export default function FamilyVisualizationPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.familyId as string;
  const { profile } = useProfileFromStore();

  const [activeView, setActiveView] = useState("folder-tree");

  const { data: family, isLoading: familyLoading } = useFamily(familyId);

  // Check if user is admin of this family
  const isAdmin = profile?.id === family?.creatorId;

  if (familyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ClipLoader size={32} color="#3B82F6" />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Family not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/families")}
          className="mt-4"
        >
          Back to Families
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {family.name} Visualization
                </h1>
                {family.description && (
                  <p className="text-gray-600 mt-1">{family.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-3">
                  {/* <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>Family: {family.name}</span>
                  </div> */}
                  {/* {family.description && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>{family.description}</span>
                    </div>
                  )} */}
                  {isAdmin && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      Admin Access
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => router.push(`/families/${familyId}/members`)}
              >
                <Users className="h-4 w-4" />
                <span>Manage Members</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => router.push("/families")}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Families</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger
              value="folder-tree"
              className="flex items-center space-x-2"
            >
              <FolderTree className="h-4 w-4" />
              <span className="hidden sm:inline">Folder Tree</span>
            </TabsTrigger>
            <TabsTrigger
              value="svg-view"
              className="flex items-center space-x-2"
            >
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">SVG View</span>
            </TabsTrigger>
            <TabsTrigger
              value="hierarchical"
              className="flex items-center space-x-2"
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Hierarchical</span>
            </TabsTrigger>
            <TabsTrigger
              value="force-directed"
              className="flex items-center space-x-2"
            >
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Dynamic</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Folder Tree View */}
        <TabsContent value="folder-tree" className="space-y-6">
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderTree className="h-5 w-5 text-green-600" />
                <span>Folder Tree View</span>
                <Badge variant="secondary">Default</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Traditional hierarchical tree structure with expandable folders
              </p>
            </CardHeader>
            <CardContent> */}
          <FamilyFolderTreeView
            familyId={familyId}
            onMemberClick={(memberId) => {
              console.log("Member clicked:", memberId);
            }}
          />
          {/* </CardContent>
          </Card> */}
        </TabsContent>

        {/* SVG View */}
        <TabsContent value="svg-view" className="space-y-6">
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-blue-600" />
                <span>SVG Tree View</span>
                <Badge variant="outline">Interactive</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Scalable vector graphics tree with zoom and pan capabilities
              </p>
            </CardHeader>
            <CardContent> */}
          <FamilySvgTreeView
            familyId={familyId}
            profile={profile}
            onMemberClick={(memberId) => {
              console.log("SVG Member clicked:", memberId);
            }}
          />
          {/* </CardContent>
          </Card> */}
        </TabsContent>

        {/* Hierarchical View */}
        <TabsContent value="hierarchical" className="space-y-6">
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-purple-600" />
                <span>Hierarchical View</span>
                <Badge variant="outline">Organized</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Clean hierarchical layout with generation-based organization
              </p>
            </CardHeader>
            <CardContent> */}
          <FamilyHierarchicalView
            familyId={familyId}
            profile={profile}
            onMemberClick={(memberId) => {
              console.log("Hierarchical Member clicked:", memberId);
            }}
          />
          {/* </CardContent>
          </Card> */}
        </TabsContent>

        {/* Force-Directed View */}
        <TabsContent value="force-directed" className="space-y-6">
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-orange-600" />
                <span>Force-Directed View</span>
                <Badge variant="outline">Dynamic</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Physics-based layout with automatic positioning and clustering
              </p>
            </CardHeader>
            <CardContent> */}
          <FamilyForceDirectedView
            familyId={familyId}
            profile={profile}
            onMemberClick={(memberId) => {
              console.log("Force-Directed Member clicked:", memberId);
            }}
          />
          {/* </CardContent>
          </Card> */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
