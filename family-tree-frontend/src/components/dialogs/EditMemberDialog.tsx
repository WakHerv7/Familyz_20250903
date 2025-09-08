"use client";

import { useState, useEffect } from "react";
import {
  useMemberRelationships,
  useUpdateProfile,
  useFamilyMembers,
  useAddRelationshipToMember,
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
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Heart,
  Plus,
  X,
  MoreHorizontal,
} from "lucide-react";
import {
  MemberWithRelationships,
  Gender,
  MemberStatus,
  RelationshipType,
} from "@/types";
import toast from "react-hot-toast";

interface EditMemberDialogProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditMemberDialog({
  memberId,
  open,
  onOpenChange,
  onSuccess,
}: EditMemberDialogProps) {
  const { data: memberData, isLoading: loadingMember } = useMemberRelationships(
    memberId || "",
    2
  );
  const updateProfile = useUpdateProfile();
  const { data: familyMembers } = useFamilyMembers(
    memberData?.member?.familyMemberships?.[0]?.familyId || ""
  );
  const addRelationship = useAddRelationshipToMember();
  const removeRelationship = useRemoveRelationshipToMember();

  const [formData, setFormData] = useState({
    name: "",
    gender: "" as Gender | "",
    status: "" as MemberStatus | "",
    bio: "",
    birthDate: "",
    birthPlace: "",
    occupation: "",
    phoneNumber: "",
    email: "",
  });

  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    relatedMemberId: "",
    relationshipType: "" as RelationshipType | "",
  });

  const member = memberData?.member;

  // Populate form when member data loads
  useEffect(() => {
    if (member && member.personalInfo) {
      setFormData({
        name: member.name || "",
        gender: member.gender || "",
        status: member.status || "",
        bio: member.personalInfo.bio || "",
        birthDate: member.personalInfo.birthDate
          ? new Date(member.personalInfo.birthDate).toISOString().split("T")[0]
          : "",
        birthPlace: member.personalInfo.birthPlace || "",
        occupation: member.personalInfo.occupation || "",
        phoneNumber: member.personalInfo.phoneNumber || "",
        email: member.personalInfo.email || "",
      });
    }
  }, [member]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    try {
      const updateData = {
        name: formData.name,
        gender: formData.gender as Gender,
        status: formData.status as MemberStatus,
        personalInfo: {
          bio: formData.bio,
          birthDate: formData.birthDate
            ? new Date(formData.birthDate).toISOString()
            : undefined,
          birthPlace: formData.birthPlace,
          occupation: formData.occupation,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
        },
      };

      await updateProfile.mutateAsync(updateData);

      toast.success("Member updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to update member");
      console.error("Update error:", error);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (member && member.personalInfo) {
      setFormData({
        name: member.name || "",
        gender: member.gender || "",
        status: member.status || "",
        bio: member.personalInfo.bio || "",
        birthDate: member.personalInfo.birthDate
          ? new Date(member.personalInfo.birthDate).toISOString().split("T")[0]
          : "",
        birthPlace: member.personalInfo.birthPlace || "",
        occupation: member.personalInfo.occupation || "",
        phoneNumber: member.personalInfo.phoneNumber || "",
        email: member.personalInfo.email || "",
      });
    }
    setShowAddRelationship(false);
    setNewRelationship({
      relatedMemberId: "",
      relationshipType: "",
    });
    onOpenChange(false);
  };

  const handleAddRelationship = async () => {
    if (!newRelationship.relatedMemberId || !newRelationship.relationshipType) {
      toast.error("Please select both a family member and relationship type");
      return;
    }

    if (!member) return;

    const familyId = member.familyMemberships?.[0]?.familyId;
    if (!familyId) {
      toast.error("Unable to determine family ID");
      return;
    }

    try {
      await addRelationship.mutateAsync({
        memberId: member.id,
        data: {
          relatedMemberId: newRelationship.relatedMemberId,
          relationshipType:
            newRelationship.relationshipType as RelationshipType,
          familyId,
        },
      });

      toast.success("Relationship added successfully!");
      setNewRelationship({
        relatedMemberId: "",
        relationshipType: "",
      });
      setShowAddRelationship(false);
      onSuccess?.(); // Refresh the data
    } catch (error) {
      toast.error("Failed to add relationship");
      console.error("Add relationship error:", error);
    }
  };

  const handleRemoveRelationship = async (
    relatedMemberId: string,
    relationshipType: RelationshipType
  ) => {
    if (!member) return;

    const familyId = member.familyMemberships?.[0]?.familyId;
    if (!familyId) {
      toast.error("Unable to determine family ID");
      return;
    }

    try {
      await removeRelationship.mutateAsync({
        memberId: member.id,
        data: {
          relatedMemberId,
          relationshipType,
          familyId,
        },
      });

      toast.success("Relationship removed successfully!");
      onSuccess?.(); // Refresh the data
    } catch (error) {
      toast.error("Failed to remove relationship");
      console.error("Remove relationship error:", error);
    }
  };

  const getRelationshipTypeLabel = (type: RelationshipType) => {
    const labels = {
      PARENT: "Parent",
      CHILD: "Child",
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

  // Get all existing relationships
  const existingRelationships = member
    ? [
        ...member.parents.map((parent) => ({
          member: parent,
          type: "PARENT" as RelationshipType,
        })),
        ...member.children.map((child) => ({
          member: child,
          type: "CHILD" as RelationshipType,
        })),
        ...member.spouses.map((spouse) => ({
          member: spouse,
          type: "SPOUSE" as RelationshipType,
        })),
      ]
    : [];

  // Get available members (exclude current member and existing relationships)
  const availableMembers =
    familyMembers?.filter(
      (familyMember) =>
        familyMember.id !== member?.id &&
        !existingRelationships.some((rel) => rel.member.id === familyMember.id)
    ) || [];

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="text-2xl font-bold text-gray-900">
            Edit Member
          </CustomDialogTitle>
          <CustomDialogDescription>
            Update member information and personal details
          </CustomDialogDescription>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        {loadingMember ? (
          <div className="flex items-center justify-center py-12">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        ) : member ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="gender"
                    className="text-sm font-medium text-gray-700"
                  >
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700"
                  >
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="DECEASED">Deceased</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h3>

              <div>
                <Label
                  htmlFor="bio"
                  className="text-sm font-medium text-gray-700"
                >
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="Tell us about this person..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="birthDate"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-green-600" />
                    Birth Date
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      handleInputChange("birthDate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="birthPlace"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <MapPin className="h-4 w-4 mr-2 text-red-600" />
                    Birth Place
                  </Label>
                  <Input
                    id="birthPlace"
                    value={formData.birthPlace}
                    onChange={(e) =>
                      handleInputChange("birthPlace", e.target.value)
                    }
                    className="mt-1"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="occupation"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Briefcase className="h-4 w-4 mr-2 text-purple-600" />
                    Occupation
                  </Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) =>
                      handleInputChange("occupation", e.target.value)
                    }
                    className="mt-1"
                    placeholder="Job title or profession"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="phoneNumber"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    className="mt-1"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2 text-orange-600" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Family Relationships */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Family Relationships ({existingRelationships.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRelationship(!showAddRelationship)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Relationship</span>
                </Button>
              </div>

              {/* Add Relationship Form */}
              {showAddRelationship && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Add New Relationship
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Family Member
                      </Label>
                      <Select
                        value={newRelationship.relatedMemberId}
                        onValueChange={(value) =>
                          setNewRelationship((prev) => ({
                            ...prev,
                            relatedMemberId: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select family member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMembers.map((familyMember) => (
                            <SelectItem
                              key={familyMember.id}
                              value={familyMember.id}
                            >
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xs mr-2">
                                  {familyMember.gender === "MALE"
                                    ? "👨"
                                    : familyMember.gender === "FEMALE"
                                    ? "👩"
                                    : "🧑"}
                                </div>
                                <span>{familyMember.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Relationship Type
                      </Label>
                      <Select
                        value={newRelationship.relationshipType}
                        onValueChange={(value) =>
                          setNewRelationship((prev) => ({
                            ...prev,
                            relationshipType: value as RelationshipType,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select relationship type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PARENT">Parent</SelectItem>
                          <SelectItem value="CHILD">Child</SelectItem>
                          <SelectItem value="SPOUSE">Spouse</SelectItem>
                          <SelectItem value="SIBLING">Sibling</SelectItem>
                          <SelectItem value="GRANDPARENT">
                            Grandparent
                          </SelectItem>
                          <SelectItem value="GRANDCHILD">Grandchild</SelectItem>
                          <SelectItem value="AUNT_UNCLE">Aunt/Uncle</SelectItem>
                          <SelectItem value="NIECE_NEPHEW">
                            Niece/Nephew
                          </SelectItem>
                          <SelectItem value="COUSIN">Cousin</SelectItem>
                          <SelectItem value="IN_LAW">In-law</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddRelationship(false);
                        setNewRelationship({
                          relatedMemberId: "",
                          relationshipType: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddRelationship}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add Relationship
                    </Button>
                  </div>
                </div>
              )}

              {/* Relationships List */}
              {existingRelationships.length > 0 && (
                <div className="space-y-2">
                  {existingRelationships.map((relationship, index) => (
                    <div
                      key={`${relationship.member.id}-${relationship.type}-${index}`}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center text-sm">
                          {relationship.member.gender === "MALE"
                            ? "👨"
                            : relationship.member.gender === "FEMALE"
                            ? "👩"
                            : "🧑"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {relationship.member.name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getRelationshipTypeLabel(relationship.type)}
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemoveRelationship(
                                relationship.member.id,
                                relationship.type
                              )
                            }
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Relationship
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}

              {existingRelationships.length === 0 && !showAddRelationship && (
                <div className="text-center py-6 text-gray-500">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No relationships found</p>
                  <p className="text-sm">
                    Click "Add Relationship" to get started
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateProfile.isPending ? (
                  <>
                    <ClipLoader size={16} color="#ffffff" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Member"
                )}
              </Button>
            </div>
          </form>
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
