"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFamilies, useCreateFamily, useProfileFromStore } from "@/hooks/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import {
  Users,
  Calendar,
  Crown,
  Shield,
  Plus,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Network,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateFamilyDialog from "@/components/dialogs/CreateFamilyDialog";
import DeleteFamilyDialog from "@/components/dialogs/DeleteFamilyDialog";

export default function FamiliesPage() {
  const router = useRouter();
  const { data: families, isLoading, error } = useFamilies();
  const { profile } = useProfileFromStore();
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    familyId: string;
    familyName: string;
    isDeleted: boolean;
  }>({
    open: false,
    familyId: "",
    familyName: "",
    isDeleted: false,
  });

  const handleFamilyClick = (familyId: string) => {
    router.push(`/families/${familyId}/members`);
  };

  const handleCreateFamilySuccess = () => {
    // Refresh the families list
    // This will be handled automatically by the useFamilies hook
  };

  const handleDeleteClick = (family: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({
      open: true,
      familyId: family.id,
      familyName: family.name,
      isDeleted: false,
    });
  };

  const handleRestoreClick = (family: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({
      open: true,
      familyId: family.id,
      familyName: family.name,
      isDeleted: true,
    });
  };

  const handleDeleteSuccess = () => {
    // Refresh will be handled automatically by the hooks
  };

  // Check if user can delete/restore a family (only creator)
  const canManageFamily = (family: any) => {
    return profile?.id === family.creatorId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ClipLoader size={32} color="#3B82F6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading families: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Families</h1>
            <p className="text-gray-600 mt-2">
              View and manage all the families you belong to
            </p>
          </div>
          {families && families.length > 0 && (
            <Button
              onClick={() => setShowCreateFamily(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Family
            </Button>
          )}
        </div>
      </div>

      {!families || families.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No families found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't been added to any families yet. Create your first family
            to get started with building your family tree.
          </p>
          <Button
            onClick={() => setShowCreateFamily(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Family
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {families.map((family) => (
            <Card
              key={family.id}
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-blue-50 transform hover:-translate-y-1"
              onClick={() => handleFamilyClick(family.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 truncate">
                      {family.name}
                    </CardTitle>
                    {family.description && (
                      <CardDescription className="mt-2 text-gray-600 line-clamp-2">
                        {family.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {family.isSubFamily && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 border-purple-200"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Sub-family
                      </Badge>
                    )}
                    {canManageFamily(family) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(family, e)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Family
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative pt-0">
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <Calendar className="h-4 w-4 mr-3 text-blue-500" />
                    <span className="font-medium">Created</span>
                    <span className="ml-auto text-gray-500">
                      {new Date(family.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-green-500" />
                        <span>Family Members</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFamilyClick(family.id);
                        }}
                      >
                        <span className="font-medium">View Members</span>
                        <Users className="h-3 w-3 ml-2" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Network className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Visualization</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-300 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/families/${family.id}/visualization`);
                        }}
                      >
                        <span className="font-medium">View Tree</span>
                        <Network className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Family Dialog */}
      <CreateFamilyDialog
        open={showCreateFamily}
        onOpenChange={setShowCreateFamily}
        onSuccess={handleCreateFamilySuccess}
      />

      {/* Delete Family Dialog */}
      <DeleteFamilyDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        familyId={deleteDialog.familyId}
        familyName={deleteDialog.familyName}
        isDeleted={deleteDialog.isDeleted}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
