"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import FamilyMemberSelector from "@/components/FamilyMemberSelector";

import {
  useAddRelationshipToMember,
  useRemoveRelationship,
  useFamilyMembers,
  useAddRelationship,
  useRemoveRelationshipToMember,
} from "@/hooks/api";
import {
  addRelationshipSchema,
  AddRelationshipFormData,
} from "@/schemas/member";
import { RelationshipType, Member, MemberWithRelationships } from "@/types";
import { ClipLoader } from "react-spinners";
import { Plus, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import ReactSelect from "react-select";

interface RelationshipManagerProps {
  currentMember: MemberWithRelationships;
  familyId?: string;
  onRelationshipChange?: () => void;
}

export default function RelationshipManager({
  currentMember,
  familyId,
  onRelationshipChange,
}: RelationshipManagerProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const addRelationshipMutation = useAddRelationship();
  const addRelationshipToMemberMutation = useAddRelationshipToMember();
  const removeRelationshipMutation = useRemoveRelationship();
  const removeRelationshipToMemberMutation = useRemoveRelationshipToMember();

  // Get family members for selection
  const { data: familyMembers = [] } = useFamilyMembers(
    familyId || currentMember.familyMemberships[0]?.familyId || ""
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddRelationshipFormData>({
    resolver: zodResolver(addRelationshipSchema),
    defaultValues: {
      relatedMemberId: "",
      relationshipType: undefined,
      familyId: currentMember.familyMemberships[0]?.familyId || "",
    },
  });

  const relationshipType = watch("relationshipType");

  // Filter out current member and already related members
  const getAvailableMembers = () => {
    const existingRelationshipIds = new Set([
      currentMember.id,
      ...currentMember.parents.map((p) => p.id),
      ...currentMember.children.map((c) => c.id),
      ...currentMember.spouses.map((s) => s.id),
    ]);

    return familyMembers.filter(
      (member) => !existingRelationshipIds.has(member.id)
    );
  };

  const onSubmit = async (data: AddRelationshipFormData) => {
    if (!selectedMember) {
      toast.error("Please select a family member");
      return;
    }

    if (!data.relatedMemberId) {
      toast.error(
        "Member ID is missing. Please try selecting the member again."
      );
      return;
    }

    if (!data.relationshipType) {
      toast.error("Please select a relationship type");
      return;
    }

    const familyId = currentMember.familyMemberships[0]?.familyId;

    const apiPayload = {
      relatedMemberId: selectedMember.id,
      relationshipType: data.relationshipType,
      familyId: familyId,
    };

    try {
      if (currentMember.id) {
        await addRelationshipToMemberMutation.mutateAsync({
          memberId: currentMember.id,
          data: apiPayload,
        });
      } else {
        await addRelationshipMutation.mutateAsync(apiPayload);
      }

      // Reset form
      reset({
        relatedMemberId: "",
        relationshipType: undefined,
        familyId: currentMember.familyMemberships[0]?.familyId || "",
      });
      setSelectedMember(null);
      onRelationshipChange?.();
    } catch (error: any) {
      console.error("Failed to add relationship:", error);
      toast.error("Failed to add relationship. Please try again.");
    }
  };

  const handleRemoveRelationship = async (
    memberId: string,
    relationshipType: RelationshipType,
    currentMemberId?: string
  ) => {
    const apiPayload = {
      relatedMemberId: memberId,
      relationshipType,
      familyId: currentMember.familyMemberships[0]?.familyId || "",
    };

    try {
      if (currentMember.id) {
        await removeRelationshipToMemberMutation.mutateAsync({
          memberId: currentMember.id,
          data: apiPayload,
        });
      } else {
        await removeRelationshipMutation.mutateAsync(apiPayload);
      }

      onRelationshipChange?.();
    } catch (error) {
      console.error("Failed to remove relationship:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Relationship */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Plus className="h-5 w-5" />
            <span>Add New Relationship</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit, (validationErrors) => {
                toast.error("Please fill in all required fields");
              })(e);
            }}
            className="space-y-4"
          >
            {/* Member Selection */}
            <div className="space-y-2">
              <Label>Select Family Member</Label>
              <ReactSelect
                value={
                  selectedMember
                    ? {
                        value: selectedMember.id,
                        label: selectedMember.name,
                        member: selectedMember,
                      }
                    : null
                }
                onChange={(option) => {
                  const member = option?.member || null;
                  setSelectedMember(member);
                  setValue("relatedMemberId", member?.id || "");
                }}
                options={getAvailableMembers().map((member) => ({
                  value: member.id,
                  label: member.name,
                  member: member,
                }))}
                placeholder="Search and select a family member..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#d1d5db",
                    "&:hover": {
                      borderColor: "#9ca3af",
                    },
                    backgroundColor: "white",
                    minHeight: "40px",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#3b82f6"
                      : state.isFocused
                      ? "#eff6ff"
                      : "white",
                    color: state.isSelected ? "white" : "#374151",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                }}
              />
            </div>

            {/* Relationship Type */}
            <div className="space-y-2">
              <Label htmlFor="relationshipType">Relationship Type</Label>
              <Select
                onValueChange={(value) =>
                  setValue("relationshipType", value as RelationshipType)
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RelationshipType.PARENT}>
                    {selectedMember?.name || "This person"} is my Parent
                  </SelectItem>
                  <SelectItem value={RelationshipType.CHILD}>
                    {selectedMember?.name || "This person"} is my Child
                  </SelectItem>
                  <SelectItem value={RelationshipType.SPOUSE}>
                    {selectedMember?.name || "This person"} is my Spouse
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.relationshipType && (
                <p className="text-red-500 text-sm">
                  {errors.relationshipType.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                !selectedMember ||
                !relationshipType ||
                addRelationshipMutation.isPending
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {addRelationshipMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <ClipLoader size={16} color="white" />
                  <span>Adding...</span>
                </div>
              ) : (
                "Add Relationship"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Relationships */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Users className="h-5 w-5" />
            <span>Current Relationships</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMember.parents && currentMember.parents.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">
                  Parents
                </h4>
                <div className="space-y-2">
                  {currentMember.parents.map((parent) => (
                    <div
                      key={parent.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {parent.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{parent.name}</p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Parent
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveRelationship(
                            parent.id,
                            RelationshipType.PARENT
                          )
                        }
                        disabled={removeRelationshipMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        {removeRelationshipMutation.isPending ? (
                          <ClipLoader size={14} color="#ef4444" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMember.spouses && currentMember.spouses.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">
                  Spouses
                </h4>
                <div className="space-y-2">
                  {currentMember.spouses.map((spouse) => (
                    <div
                      key={spouse.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-pink-600">
                            {spouse.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{spouse.name}</p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-pink-50 text-pink-700 border-pink-200"
                          >
                            Spouse
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveRelationship(
                            spouse.id,
                            RelationshipType.SPOUSE
                          )
                        }
                        disabled={removeRelationshipMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        {removeRelationshipMutation.isPending ? (
                          <ClipLoader size={14} color="#ef4444" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMember.children && currentMember.children.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">
                  Children
                </h4>
                <div className="space-y-2">
                  {currentMember.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {child.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{child.name}</p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                          >
                            Child
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveRelationship(
                            child.id,
                            RelationshipType.CHILD
                          )
                        }
                        disabled={removeRelationshipMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        {removeRelationshipMutation.isPending ? (
                          <ClipLoader size={14} color="#ef4444" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!currentMember.parents || currentMember.parents.length === 0) &&
              (!currentMember.spouses || currentMember.spouses.length === 0) &&
              (!currentMember.children ||
                currentMember.children.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No relationships added yet.</p>
                  <p className="text-sm">
                    Use the form above to connect with family members.
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
