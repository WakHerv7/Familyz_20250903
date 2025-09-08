"use client";

import { useState, useEffect } from "react";
import {
  useCreateFamily,
  useFamilies,
  useFamilyMembers,
  useAddMemberToFamily,
  useProfile,
} from "@/hooks/api";
import {
  CustomDialog,
  CustomDialogContent,
  CustomDialogDescription,
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogClose,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipLoader } from "react-spinners";
import {
  Users,
  Plus,
  X,
  MoreHorizontal,
  Crown,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { Family } from "@/types";
import toast from "react-hot-toast";

interface CreateFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateFamilyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFamilyDialogProps) {
  const createFamily = useCreateFamily();
  const addMemberToFamily = useAddMemberToFamily();
  const { data: families } = useFamilies();
  const { data: profile } = useProfile();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isSubFamily: false,
    parentFamilyId: "",
    addCreatorAsMember: true, // Default to true for backward compatibility
  });

  const [membersToAdd, setMembersToAdd] = useState<
    Array<{
      id: string;
      name: string;
      sourceFamilyId: string;
      sourceFamilyName: string;
      role: "MEMBER" | "HEAD" | "ADMIN";
    }>
  >([]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

  const { data: selectedFamilyMembers } = useFamilyMembers(selectedFamilyId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        description: "",
        isSubFamily: false,
        parentFamilyId: "",
        addCreatorAsMember: true,
      });
      setMembersToAdd([]);
      setShowAddMember(false);
      setSelectedFamilyId("");
    }
  }, [open]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddMember = () => {
    setShowAddMember(true);
  };

  const handleMemberSelection = (member: any) => {
    const existingMember = membersToAdd.find((m) => m.id === member.id);
    if (existingMember) {
      toast.error("This member is already added to the family");
      return;
    }

    const sourceFamily = families?.find((f) => f.id === selectedFamilyId);
    const newMember = {
      id: member.id,
      name: member.name,
      sourceFamilyId: selectedFamilyId,
      sourceFamilyName: sourceFamily?.name || "Unknown Family",
      role: "MEMBER" as const,
    };

    setMembersToAdd((prev) => [...prev, newMember]);
    setShowAddMember(false);
    setSelectedFamilyId("");
    toast.success("Member added to family");
  };

  const handleRemoveMember = (memberId: string) => {
    setMembersToAdd((prev) => prev.filter((m) => m.id !== memberId));
    toast.success("Member removed from family");
  };

  const handleMemberRoleChange = (
    memberId: string,
    role: "MEMBER" | "HEAD" | "ADMIN"
  ) => {
    setMembersToAdd((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a family name");
      return;
    }

    if (formData.isSubFamily && !formData.parentFamilyId) {
      toast.error("Please select a parent family for the sub-family");
      return;
    }

    try {
      // Step 1: Create the family
      const newFamily = await createFamily.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isSubFamily: formData.isSubFamily,
        parentFamilyId: formData.isSubFamily
          ? formData.parentFamilyId
          : undefined,
        addCreatorAsMember: formData.addCreatorAsMember,
      });

      // Step 2: Add members to the family if any were selected
      // Note: The creator is automatically added during family creation,
      // so we filter them out to avoid the "already in family" error
      if (membersToAdd.length > 0 && newFamily?.id) {
        // Get current user profile to identify the creator
        const currentMemberId = profile?.id;

        // Filter out the creator since they're automatically added
        const membersToAddFiltered = membersToAdd.filter(
          (member) => member.id !== currentMemberId
        );

        if (membersToAddFiltered.length > 0) {
          const memberPromises = membersToAddFiltered.map((member) =>
            addMemberToFamily.mutateAsync({
              familyId: newFamily.id,
              memberId: member.id,
              role: member.role,
            })
          );

          // Wait for all member additions to complete
          await Promise.all(memberPromises);
        }
      }

      toast.success("Family created successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create family");
      console.error("Create family error:", error);
    }
  };

  const availableFamilies =
    families?.filter(
      (family) => !formData.isSubFamily || family.id !== formData.parentFamilyId
    ) || [];

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            Create New Family
          </CustomDialogTitle>
          <CustomDialogDescription>
            Create a new family and add members to get started
          </CustomDialogDescription>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Family Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="mt-1"
                  placeholder="Enter family name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="mt-1"
                  rows={3}
                  placeholder="Describe your family..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSubFamily"
                  checked={formData.isSubFamily}
                  onChange={(e) =>
                    handleInputChange("isSubFamily", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                <Label
                  htmlFor="isSubFamily"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  This is a sub-family
                </Label>
              </div>

              {formData.isSubFamily && (
                <div>
                  <Label
                    htmlFor="parentFamilyId"
                    className="text-sm font-medium text-gray-700"
                  >
                    Parent Family *
                  </Label>
                  <Select
                    value={formData.parentFamilyId}
                    onValueChange={(value) =>
                      handleInputChange("parentFamilyId", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select parent family" />
                    </SelectTrigger>
                    <SelectContent>
                      {families?.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                            <span>{family.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addCreatorAsMember"
                  checked={formData.addCreatorAsMember}
                  onChange={(e) =>
                    handleInputChange("addCreatorAsMember", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                <Label
                  htmlFor="addCreatorAsMember"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <Users className="h-4 w-4 mr-2 text-green-600" />
                  Add me as a member of this family
                </Label>
              </div>
            </div>
          </div>

          {/* Add Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-green-600" />
                Add Members ({membersToAdd.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMember}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Member</span>
              </Button>
            </div>

            {/* Family Selection for Adding Members */}
            {showAddMember && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  Select Family to Add Members From
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Select Family
                    </Label>
                    <Select
                      value={selectedFamilyId}
                      onValueChange={setSelectedFamilyId}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a family" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFamilies.map((family) => (
                          <SelectItem key={family.id} value={family.id}>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-blue-500" />
                              <span>{family.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFamilyId &&
                    selectedFamilyMembers &&
                    selectedFamilyMembers.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Select Members to Add
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {selectedFamilyMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleMemberSelection(member)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xs">
                                  {member.gender === "MALE"
                                    ? "👨"
                                    : member.gender === "FEMALE"
                                    ? "👩"
                                    : "🧑"}
                                </div>
                                <span className="text-sm font-medium">
                                  {member.name}
                                </span>
                              </div>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddMember(false);
                        setSelectedFamilyId("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Members List */}
            {membersToAdd.length > 0 && (
              <div className="space-y-2">
                {membersToAdd.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          From: {member.sourceFamilyName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleMemberRoleChange(
                            member.id,
                            value as "MEMBER" | "HEAD" | "ADMIN"
                          )
                        }
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="HEAD">Head</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {membersToAdd.length === 0 && !showAddMember && (
              <div className="text-center py-6 text-gray-500">
                <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No members added yet</p>
                <p className="text-sm">Click "Add Member" to get started</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createFamily.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFamily.isPending || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createFamily.isPending ? (
                <>
                  <ClipLoader size={16} color="#ffffff" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Create Family
                </>
              )}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </CustomDialog>
  );
}
