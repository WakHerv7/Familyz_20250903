"use client";

import { useState, useEffect } from "react";
import { useFamilyMembers, useAddRelationshipToMember } from "@/hooks/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipLoader } from "react-spinners";
import { Users, Heart, UserPlus } from "lucide-react";
import { Member, RelationshipType } from "@/types";
import toast from "react-hot-toast";

interface AddRelationshipDialogProps {
  memberId: string | null;
  familyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddRelationshipDialog({
  memberId,
  familyId,
  open,
  onOpenChange,
  onSuccess,
}: AddRelationshipDialogProps) {
  const { data: familyMembers, isLoading: loadingMembers } =
    useFamilyMembers(familyId);
  const addRelationship = useAddRelationshipToMember();

  const [formData, setFormData] = useState({
    relatedMemberId: "",
    relationshipType: "" as RelationshipType | "",
    notes: "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        relatedMemberId: "",
        relationshipType: "",
        notes: "",
      });
    }
  }, [open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberId || !formData.relatedMemberId || !formData.relationshipType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (memberId === formData.relatedMemberId) {
      toast.error("Cannot create a relationship with yourself");
      return;
    }

    try {
      await addRelationship.mutateAsync({
        memberId,
        data: {
          relatedMemberId: formData.relatedMemberId,
          relationshipType: formData.relationshipType as RelationshipType,
          familyId,
        },
      });

      toast.success("Relationship added successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add relationship");
      console.error("Add relationship error:", error);
    }
  };

  // Filter out the current member from available options
  const availableMembers =
    familyMembers?.filter((member) => member.id !== memberId) || [];

  const getRelationshipTypeOptions = () => {
    return [
      { value: "PARENT", label: "Parent", icon: "👨‍👩‍👧‍👦" },
      { value: "CHILD", label: "Child", icon: "👶" },
      { value: "SPOUSE", label: "Spouse", icon: "💍" },
      { value: "SIBLING", label: "Sibling", icon: "👫" },
      { value: "GRANDPARENT", label: "Grandparent", icon: "👴" },
      { value: "GRANDCHILD", label: "Grandchild", icon: "🧒" },
      { value: "AUNT_UNCLE", label: "Aunt/Uncle", icon: "👨‍👩‍👧" },
      { value: "NIECE_NEPHEW", label: "Niece/Nephew", icon: "👦" },
      { value: "COUSIN", label: "Cousin", icon: "👨‍👩‍👧‍👦" },
      { value: "IN_LAW", label: "In-law", icon: "👰" },
      { value: "OTHER", label: "Other", icon: "🤝" },
    ];
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="h-6 w-6 mr-2 text-red-600" />
            Add Relationship
          </CustomDialogTitle>
          <CustomDialogDescription>
            Create a new relationship between family members
          </CustomDialogDescription>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Relationship Type */}
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="relationshipType"
                className="text-sm font-medium text-gray-700"
              >
                Relationship Type *
              </Label>
              <Select
                value={formData.relationshipType}
                onValueChange={(value) =>
                  handleInputChange("relationshipType", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  {getRelationshipTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <span className="mr-2">{option.icon}</span>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Related Member */}
            <div>
              <Label
                htmlFor="relatedMember"
                className="text-sm font-medium text-gray-700"
              >
                Related Family Member *
              </Label>
              {loadingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <ClipLoader size={20} color="#3B82F6" />
                </div>
              ) : (
                <Select
                  value={formData.relatedMemberId}
                  onValueChange={(value) =>
                    handleInputChange("relatedMemberId", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm mr-3">
                            {member.gender === "MALE"
                              ? "👨"
                              : member.gender === "FEMALE"
                              ? "👩"
                              : "🧑"}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">
                              {member.status} •{" "}
                              {member.gender || "Not specified"}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {availableMembers.length === 0 && !loadingMembers && (
                <p className="text-sm text-gray-500 mt-2">
                  No other family members available to create relationships
                  with.
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Notes (Optional)
              </Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Add any additional notes about this relationship..."
              />
            </div>
          </div>

          {/* Preview */}
          {formData.relatedMemberId && formData.relationshipType && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Relationship Preview
              </h4>
              <div className="text-sm text-blue-700">
                <div className="flex items-center space-x-2">
                  <span>
                    {familyMembers?.find((m) => m.id === memberId)?.name ||
                      "Current Member"}
                  </span>
                  <span className="text-blue-500">→</span>
                  <span className="font-medium">
                    {getRelationshipTypeOptions().find(
                      (opt) => opt.value === formData.relationshipType
                    )?.label || formData.relationshipType}
                  </span>
                  <span className="text-blue-500">→</span>
                  <span>
                    {familyMembers?.find(
                      (m) => m.id === formData.relatedMemberId
                    )?.name || "Selected Member"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addRelationship.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                addRelationship.isPending ||
                !formData.relatedMemberId ||
                !formData.relationshipType ||
                loadingMembers
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addRelationship.isPending ? (
                <>
                  <ClipLoader size={16} color="#ffffff" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Relationship
                </>
              )}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </CustomDialog>
  );
}
