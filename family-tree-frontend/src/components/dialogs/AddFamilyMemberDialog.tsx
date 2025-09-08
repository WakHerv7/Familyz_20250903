"use client";

import { useState, useEffect } from "react";
import { useCreateMember, useFamilyMembers } from "@/hooks/api";
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
  UserPlus,
  Calendar,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Heart,
  Plus,
  X,
  MoreHorizontal,
} from "lucide-react";
import { Gender, MemberStatus, FamilyRole, RelationshipType } from "@/types";
import toast from "react-hot-toast";

interface AddFamilyMemberDialogProps {
  familyId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preSelectedRelationship?: {
    type: "parent" | "spouse" | "child";
    member: {
      id: string;
      name: string;
    };
  } | null;
}

export default function AddFamilyMemberDialog({
  familyId,
  open,
  onOpenChange,
  onSuccess,
  preSelectedRelationship,
}: AddFamilyMemberDialogProps) {
  const createMember = useCreateMember();
  const { data: familyMembers } = useFamilyMembers(familyId || "");

  const [formData, setFormData] = useState({
    name: "",
    gender: "" as Gender | "",
    status: MemberStatus.ACTIVE,
    role: FamilyRole.MEMBER,
    bio: "",
    birthDate: "",
    birthPlace: "",
    occupation: "",
    phoneNumber: "",
    email: "",
  });

  const [relationships, setRelationships] = useState<
    Array<{
      id: string;
      relatedMemberId: string;
      relationshipType: RelationshipType;
      relatedMember: any;
    }>
  >([]);

  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    relatedMemberId: "",
    relationshipType: "" as RelationshipType | "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        gender: "",
        status: MemberStatus.ACTIVE,
        role: FamilyRole.MEMBER,
        bio: "",
        birthDate: "",
        birthPlace: "",
        occupation: "",
        phoneNumber: "",
        email: "",
      });
      setRelationships([]);
      setShowAddRelationship(false);
      setNewRelationship({
        relatedMemberId: "",
        relationshipType: "",
      });
    }
  }, [open]);

  // Pre-populate spouse relationship when dialog opens with preSelectedRelationship
  useEffect(() => {
    if (open && preSelectedRelationship && familyMembers) {
      const relatedMember = familyMembers.find(
        (member) => member.id === preSelectedRelationship.member.id
      );

      if (relatedMember) {
        const relationshipType =
          preSelectedRelationship.type === "spouse"
            ? RelationshipType.SPOUSE
            : preSelectedRelationship.type === "parent"
            ? RelationshipType.PARENT
            : RelationshipType.CHILD;

        const relationship = {
          id: `preselected-${Date.now()}`,
          relatedMemberId: preSelectedRelationship.member.id,
          relationshipType,
          relatedMember,
        };

        setRelationships([relationship]);
        toast.success(
          `Pre-selected ${preSelectedRelationship.type} relationship added`
        );
      }
    }
  }, [open, preSelectedRelationship, familyMembers]);

  const handleAddRelationship = () => {
    if (!newRelationship.relatedMemberId || !newRelationship.relationshipType) {
      toast.error("Please select both a family member and relationship type");
      return;
    }

    const relatedMember = familyMembers?.find(
      (member) => member.id === newRelationship.relatedMemberId
    );

    if (!relatedMember) {
      toast.error("Selected family member not found");
      return;
    }

    // Check if relationship already exists
    const existingRelationship = relationships.find(
      (rel) =>
        rel.relatedMemberId === newRelationship.relatedMemberId &&
        rel.relationshipType === newRelationship.relationshipType
    );

    if (existingRelationship) {
      toast.error("This relationship already exists");
      return;
    }

    const relationship = {
      id: `temp-${Date.now()}`,
      relatedMemberId: newRelationship.relatedMemberId,
      relationshipType: newRelationship.relationshipType as RelationshipType,
      relatedMember,
    };

    setRelationships((prev) => [...prev, relationship]);
    setNewRelationship({
      relatedMemberId: "",
      relationshipType: "",
    });
    setShowAddRelationship(false);
    toast.success("Relationship added");
  };

  const handleRemoveRelationship = (relationshipId: string) => {
    setRelationships((prev) => prev.filter((rel) => rel.id !== relationshipId));
    toast.success("Relationship removed");
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

  const availableMembers =
    familyMembers?.filter(
      (member) =>
        !relationships.some((rel) => rel.relatedMemberId === member.id)
    ) || [];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a name for the family member");
      return;
    }

    if (!familyId) {
      toast.error("No family selected. Please select a family first.");
      return;
    }

    try {
      await createMember.mutateAsync({
        name: formData.name.trim(),
        gender: formData.gender as Gender,
        status: formData.status as MemberStatus,
        role: formData.role as FamilyRole,
        familyId,
        personalInfo: {
          bio: formData.bio.trim() || undefined,
          birthDate: formData.birthDate
            ? new Date(formData.birthDate).toISOString()
            : undefined,
          birthPlace: formData.birthPlace.trim() || undefined,
          occupation: formData.occupation.trim() || undefined,
          phoneNumber: formData.phoneNumber.trim() || undefined,
          email: formData.email.trim() || undefined,
        },
        initialRelationships:
          relationships.length > 0
            ? relationships.map((rel) => ({
                relatedMemberId: rel.relatedMemberId,
                relationshipType: rel.relationshipType,
                familyId,
              }))
            : undefined,
      });

      toast.success("Family member added successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add family member");
      console.error("Add member error:", error);
    }
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <UserPlus className="h-6 w-6 mr-2 text-green-600" />
            Add Family Member
          </CustomDialogTitle>
          <CustomDialogDescription>
            Add a new member to this family with their personal information
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
                  placeholder="Enter full name"
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
                  onValueChange={(value) => handleInputChange("gender", value)}
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
                  onValueChange={(value) => handleInputChange("status", value)}
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

              <div>
                <Label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-700"
                >
                  Family Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="HEAD">Head</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
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
                Family Relationships ({relationships.length})
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
                        {availableMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xs mr-2">
                                {member.gender === "MALE"
                                  ? "👨"
                                  : member.gender === "FEMALE"
                                  ? "👩"
                                  : "🧑"}
                              </div>
                              <span>{member.name}</span>
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
                        <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
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
            {relationships.length > 0 && (
              <div className="space-y-2">
                {relationships.map((relationship) => (
                  <div
                    key={relationship.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center text-sm">
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
                        <Badge variant="outline" className="text-xs">
                          {getRelationshipTypeLabel(
                            relationship.relationshipType
                          )}
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
                            handleRemoveRelationship(relationship.id)
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

            {relationships.length === 0 && !showAddRelationship && (
              <div className="text-center py-6 text-gray-500">
                <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No relationships added yet</p>
                <p className="text-sm">
                  Click "Add Relationship" to get started
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {formData.name && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Member Preview
              </h4>
              <div className="text-sm text-blue-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm">
                    {formData.gender === "MALE"
                      ? "👨"
                      : formData.gender === "FEMALE"
                      ? "👩"
                      : "🧑"}
                  </div>
                  <div>
                    <div className="font-medium">{formData.name}</div>
                    <div className="text-xs">
                      {formData.status} • {formData.role} •{" "}
                      {formData.gender || "Not specified"}
                    </div>
                  </div>
                </div>
                {relationships.length > 0 && (
                  <div className="mt-2 text-xs">
                    Relationships: {relationships.length} family member
                    {relationships.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMember.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMember.isPending || !formData.name.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMember.isPending ? (
                <>
                  <ClipLoader size={16} color="#ffffff" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </CustomDialog>
  );
}
