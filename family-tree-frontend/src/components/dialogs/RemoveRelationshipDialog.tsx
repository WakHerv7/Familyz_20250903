"use client";

import { useState, useEffect } from "react";
import {
  useMemberRelationships,
  useRemoveRelationshipToMember,
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
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import { Users, Heart, AlertTriangle, UserMinus } from "lucide-react";
import { Member, RelationshipType } from "@/types";
import toast from "react-hot-toast";

interface RemoveRelationshipDialogProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function RemoveRelationshipDialog({
  memberId,
  open,
  onOpenChange,
  onSuccess,
}: RemoveRelationshipDialogProps) {
  const { data: memberData, isLoading: loadingMember } = useMemberRelationships(
    memberId || "",
    2
  );
  const removeRelationship = useRemoveRelationshipToMember();

  const [selectedRelationship, setSelectedRelationship] = useState<{
    relatedMemberId: string;
    relationshipType: RelationshipType;
    relatedMember: Member;
    direction: string;
  } | null>(null);

  const member = memberData?.member;

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedRelationship(null);
    }
  }, [open]);

  const handleRemoveRelationship = async () => {
    if (!memberId || !selectedRelationship) return;

    try {
      await removeRelationship.mutateAsync({
        memberId,
        data: {
          relatedMemberId: selectedRelationship.relatedMemberId,
          relationshipType: selectedRelationship.relationshipType,
          familyId: "", // This might need to be passed from parent or derived
        },
      });

      toast.success("Relationship removed successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to remove relationship");
      console.error("Remove relationship error:", error);
    }
  };

  // Combine all relationships for display
  const allRelationships = [
    ...(member?.parents || []).map((parent) => ({
      relatedMemberId: parent.id,
      relationshipType: "PARENT" as RelationshipType,
      relatedMember: parent,
      direction: "incoming" as const,
    })),
    ...(member?.children || []).map((child) => ({
      relatedMemberId: child.id,
      relationshipType: "CHILD" as RelationshipType,
      relatedMember: child,
      direction: "outgoing" as const,
    })),
    ...(member?.spouses || []).map((spouse) => ({
      relatedMemberId: spouse.id,
      relationshipType: "SPOUSE" as RelationshipType,
      relatedMember: spouse,
      direction: "bidirectional" as const,
    })),
  ];

  const getRelationshipTypeLabel = (
    type: RelationshipType,
    direction: string
  ) => {
    const labels = {
      PARENT: direction === "incoming" ? "Parent" : "Child",
      CHILD: direction === "outgoing" ? "Child" : "Parent",
      SPOUSE: "Spouse",
      SIBLING: "Sibling",
      GRANDPARENT: "Grandparent",
      GRANDCHILD: "Grandchild",
      AUNT_UNCLE: "Aunt/Uncle",
      NIECE_NEPHEW: "Niece/Nephew",
      COUSIN: "Cousin",
      IN_LAW: "In-law",
      OTHER: "Other",
    };
    return labels[type] || type;
  };

  const getRelationshipIcon = (type: RelationshipType) => {
    const icons = {
      PARENT: "👨‍👩‍👧‍👦",
      CHILD: "👶",
      SPOUSE: "💍",
      SIBLING: "👫",
      GRANDPARENT: "👴",
      GRANDCHILD: "🧒",
      AUNT_UNCLE: "👨‍👩‍👧",
      NIECE_NEPHEW: "👦",
      COUSIN: "👨‍👩‍👧‍👦",
      IN_LAW: "👰",
      OTHER: "🤝",
    };
    return icons[type] || "🤝";
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <UserMinus className="h-6 w-6 mr-2 text-red-600" />
            Remove Relationship
          </CustomDialogTitle>
          <CustomDialogDescription>
            Select a relationship to remove from this family member
          </CustomDialogDescription>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        {loadingMember ? (
          <div className="flex items-center justify-center py-12">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : member ? (
          <div className="space-y-6">
            {/* Current Member Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Current Member
              </h4>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-lg mr-3">
                  {member.gender === "MALE"
                    ? "👨"
                    : member.gender === "FEMALE"
                    ? "👩"
                    : "🧑"}
                </div>
                <div>
                  <div className="font-medium text-blue-900">{member.name}</div>
                  <div className="text-sm text-blue-700">
                    {member.status} • {member.gender || "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {/* Relationships List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Relationship to Remove
              </h3>

              {allRelationships.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No relationships found for this member.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allRelationships.map((relationship, index) => (
                    <div
                      key={`${relationship.relatedMemberId}-${relationship.relationshipType}-${index}`}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedRelationship?.relatedMemberId ===
                          relationship.relatedMemberId &&
                        selectedRelationship?.relationshipType ===
                          relationship.relationshipType
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRelationship(relationship)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center text-lg">
                            {relationship.relatedMember.gender === "MALE"
                              ? "👨"
                              : relationship.relatedMember.gender === "FEMALE"
                              ? "👩"
                              : "🧑"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {relationship.relatedMember.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {relationship.relatedMember.status} •{" "}
                              {relationship.relatedMember.gender ||
                                "Not specified"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className="flex items-center space-x-1"
                          >
                            <span>
                              {getRelationshipIcon(
                                relationship.relationshipType
                              )}
                            </span>
                            <span>
                              {getRelationshipTypeLabel(
                                relationship.relationshipType,
                                relationship.direction
                              )}
                            </span>
                          </Badge>
                          {selectedRelationship?.relatedMemberId ===
                            relationship.relatedMemberId &&
                            selectedRelationship?.relationshipType ===
                              relationship.relationshipType && (
                              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning Message */}
            {selectedRelationship && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">
                      Confirm Relationship Removal
                    </h4>
                    <p className="text-sm text-yellow-700">
                      You are about to remove the relationship between{" "}
                      <span className="font-medium">{member.name}</span> and{" "}
                      <span className="font-medium">
                        {selectedRelationship.relatedMember.name}
                      </span>{" "}
                      as{" "}
                      <span className="font-medium">
                        {getRelationshipTypeLabel(
                          selectedRelationship.relationshipType,
                          selectedRelationship.direction
                        )}
                      </span>
                      .
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      This action cannot be undone. The relationship will be
                      permanently removed from the family tree.
                    </p>
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
                disabled={removeRelationship.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveRelationship}
                disabled={
                  removeRelationship.isPending ||
                  !selectedRelationship ||
                  allRelationships.length === 0
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {removeRelationship.isPending ? (
                  <>
                    <ClipLoader size={16} color="#ffffff" className="mr-2" />
                    Removing...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Relationship
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load member data</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        )}
      </CustomDialogContent>
    </CustomDialog>
  );
}
