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
  useAddRelationship,
  useRemoveRelationship,
  useFamilyMembers,
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
  const removeRelationshipMutation = useRemoveRelationship();

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

    try {
      await addRelationshipMutation.mutateAsync({
        relatedMemberId: selectedMember.id,
        relationshipType: data.relationshipType,
      });

      // Reset form
      reset();
      setSelectedMember(null);
      onRelationshipChange?.();
    } catch (error) {
      console.error("Failed to add relationship:", error);
    }
  };

  const handleRemoveRelationship = async (
    memberId: string,
    relationshipType: RelationshipType
  ) => {
    try {
      await removeRelationshipMutation.mutateAsync({
        relatedMemberId: memberId,
        relationshipType,
      });
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                onChange={(option) => setSelectedMember(option?.member || null)}
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
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Current Relationships</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMember.parents && currentMember.parents.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">Parents</h4>
                <div className="space-y-2">
                  {currentMember.parents.map((parent) => (
                    <div key={parent.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(parent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{parent.name}</p>
                          <Badge variant="outline" className="text-xs">Parent</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRelationship(parent.id, RelationshipType.PARENT)}
                        disabled={removeRelationshipMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMember.spouses && currentMember.spouses.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">Spouses</h4>
                <div className="space-y-2">
                  {currentMember.spouses.map((spouse) => (
                    <div key={spouse.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(spouse.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{spouse.name}</p>
                          <Badge variant="outline" className="text-xs">Spouse</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRelationship(spouse.id, RelationshipType.SPOUSE)}
                        disabled={removeRelationshipMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMember.children && currentMember.children.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-gray-700">Children</h4>
                <div className="space-y-2">
                  {currentMember.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(child.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{child.name}</p>
                          <Badge variant="outline" className="text-xs">Child</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRelationship(child.id, RelationshipType.CHILD)}
                        disabled={removeRelationshipMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!currentMember.parents || currentMember.parents.length === 0) &&
             (!currentMember.spouses || currentMember.spouses.length === 0) &&
             (!currentMember.children || currentMember.children.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No relationships added yet.</p>
                <p className="text-sm">Use the form above to connect with family members.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
