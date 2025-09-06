"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useCreateMember, useFamilies, useFamilyMembers } from "@/hooks/api";
import { createMemberSchema, CreateMemberFormData } from "@/schemas/member";
import {
  Gender,
  MemberStatus,
  FamilyRole,
  RelationshipType,
  Member,
  CreateMemberRequest,
} from "@/types";
import { ClipLoader } from "react-spinners";
import { useAppSelector } from "@/hooks/redux";
import { Plus, Trash2, Users, Heart, Mail, Send, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactSelect from "react-select";

interface AddFamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRelationship?: {
    type: "parent" | "spouse" | "child" | null;
    member: { id: string; name: string } | null;
  };
}

interface RelationshipEntry {
  relatedMemberId: string;
  relatedMemberName: string;
  relationshipType: RelationshipType;
}

interface CreateMemberForm {
  name: string;
  gender?: Gender;
  status?: MemberStatus;
  familyId: string;
  role?: FamilyRole;
  personalInfo?: {
    bio?: string;
    birthDate?: string;
    birthPlace?: string;
    occupation?: string;
    phoneNumber?: string;
    email?: string;
  };
}

export default function AddFamilyMemberDialog({
  open,
  onOpenChange,
  initialRelationship,
}: AddFamilyMemberDialogProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { data: families = [] } = useFamilies();
  const createMemberMutation = useCreateMember();

  const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType | null>(null);
  const [sendInvitation, setSendInvitation] = useState(false);
  const [invitationPermissions, setInvitationPermissions] = useState<string[]>([
    "view_tree",
    "edit_own_profile",
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateMemberForm>({
    defaultValues: {
      name: "",
      gender: Gender.PREFER_NOT_TO_SAY,
      status: MemberStatus.ACTIVE,
      familyId: families.length > 0 ? families[0].id : "",
      role: FamilyRole.MEMBER,
    },
    mode: "onChange",
  });

  const selectedFamilyId = watch("familyId");
  const { data: familyMembers = [], isLoading: familyMembersLoading } =
    useFamilyMembers(selectedFamilyId || "");

  // Pre-populate relationships when initialRelationship is provided
  useEffect(() => {
    if (initialRelationship?.member && initialRelationship?.type && open) {
      const relationshipTypeMap = {
        parent: RelationshipType.CHILD, // If adding a parent, the new member is the child
        spouse: RelationshipType.SPOUSE,
        child: RelationshipType.PARENT, // If adding a child, the new member is the parent
      };

      const mappedType = relationshipTypeMap[initialRelationship.type];
      if (mappedType) {
        const initialRelationshipEntry: RelationshipEntry = {
          relatedMemberId: initialRelationship.member.id,
          relatedMemberName: initialRelationship.member.name,
          relationshipType: mappedType,
        };

        setRelationships([initialRelationshipEntry]);
      }
    }
  }, [initialRelationship, open]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailableMembers = () => {
    const existingRelationshipIds = new Set(
      relationships.map((r) => r.relatedMemberId)
    );

    return familyMembers.filter(
      (member) => !existingRelationshipIds.has(member.id)
    );
  };

  const addRelationship = () => {
    if (!selectedMember || !relationshipType) return;

    const newRelationship: RelationshipEntry = {
      relatedMemberId: selectedMember.id,
      relatedMemberName: selectedMember.name,
      relationshipType,
    };

    setRelationships((prev) => [...prev, newRelationship]);
    setSelectedMember(null);
    setRelationshipType(null);
  };

  const removeRelationship = (index: number) => {
    setRelationships((prev) => prev.filter((_, i) => i !== index));
  };

  const getRelationshipTypeLabel = (type: RelationshipType) => {
    switch (type) {
      case RelationshipType.PARENT:
        return "Parent";
      case RelationshipType.CHILD:
        return "Child";
      case RelationshipType.SPOUSE:
        return "Spouse";
      default:
        return type;
    }
  };

  const onSubmit = async (data: CreateMemberForm) => {
    // Validate required fields
    if (!data.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!data.familyId) {
      toast.error("Please select a family");
      return;
    }

    // Validate invitation requirements
    if (sendInvitation && !data.personalInfo?.email) {
      toast.error("Email is required to send invitation");
      return;
    }

    try {
      const submitData: CreateMemberRequest = {
        name: data.name.trim(),
        gender: data.gender,
        status: data.status || MemberStatus.ACTIVE,
        role: data.role || FamilyRole.MEMBER,
        familyId: data.familyId,
        personalInfo: data.personalInfo
          ? {
              bio: data.personalInfo.bio?.trim() || undefined,
              birthDate: data.personalInfo.birthDate || undefined,
              birthPlace: data.personalInfo.birthPlace?.trim() || undefined,
              occupation: data.personalInfo.occupation?.trim() || undefined,
              phoneNumber: data.personalInfo.phoneNumber?.trim() || undefined,
              email: data.personalInfo.email?.trim() || undefined,
            }
          : undefined,
        initialRelationships:
          relationships.length > 0
            ? relationships.map((rel) => ({
                relatedMemberId: rel.relatedMemberId,
                relationshipType: rel.relationshipType,
              }))
            : undefined,
      };

      console.log("Submitting member data:", submitData);
      const createdMember = await createMemberMutation.mutateAsync(submitData);

      // Send invitation if requested
      if (sendInvitation && data.personalInfo?.email) {
        try {
          // Here you would call the invitation API
          // For now, we'll just show a success message
          console.log("Sending invitation to:", data.personalInfo.email);
          console.log("With permissions:", invitationPermissions);

          toast.success(
            `Member created and invitation sent to ${data.personalInfo.email}!`
          );
        } catch (invitationError) {
          console.error("Failed to send invitation:", invitationError);
          toast.error("Member created but failed to send invitation");
        }
      } else {
        toast.success("Family member created successfully!");
      }

      // Close dialog and reset form
      onOpenChange(false);
      reset();
      setRelationships([]);
      setSendInvitation(false);
      setInvitationPermissions(["view_tree", "edit_own_profile"]);
    } catch (error) {
      console.error("Failed to create member:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create family member"
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setRelationships([]);
    setSelectedMember(null);
    setRelationshipType(null);
    setSendInvitation(false);
    setInvitationPermissions(["view_tree", "edit_own_profile"]);
  };

  return (
    <CustomDialog open={open} onOpenChange={handleClose}>
      <CustomDialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Add Family Member</span>
          </CustomDialogTitle>
          <CustomDialogDescription>
            Create a new family member and establish their relationships.
            Optionally send them an invitation to join the platform.
          </CustomDialogDescription>
          <CustomDialogClose onClick={handleClose} />
        </CustomDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Family Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Family Selection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="familyId">Select Family *</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("familyId", value, { shouldValidate: true });
                    setRelationships([]); // Clear relationships when family changes
                  }}
                  defaultValue={families.length > 0 ? families[0].id : ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a family" />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.familyId && (
                  <p className="text-red-500 text-sm">
                    {errors.familyId.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register("name", {
                      required: "Name is required",
                      minLength: { value: 1, message: "Name cannot be empty" },
                    })}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("gender", value as Gender)
                    }
                    defaultValue={Gender.PREFER_NOT_TO_SAY}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.PREFER_NOT_TO_SAY}>
                        Prefer not to say
                      </SelectItem>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("status", value as MemberStatus)
                    }
                    defaultValue={MemberStatus.ACTIVE}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MemberStatus.ACTIVE}>
                        Active
                      </SelectItem>
                      <SelectItem value={MemberStatus.INACTIVE}>
                        Inactive
                      </SelectItem>
                      <SelectItem value={MemberStatus.DECEASED}>
                        Deceased
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Family Role</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("role", value as FamilyRole)
                    }
                    defaultValue={FamilyRole.MEMBER}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FamilyRole.MEMBER}>Member</SelectItem>
                      <SelectItem value={FamilyRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={FamilyRole.HEAD}>Head</SelectItem>
                      <SelectItem value={FamilyRole.VIEWER}>Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initial Relationships */}
          {selectedFamilyId && (
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Heart className="h-5 w-5 text-green-600" />
                  <span>Initial Relationships (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {familyMembersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <ClipLoader size={24} color="#16a34a" />
                    <span className="ml-2 text-sm text-gray-600">
                      Loading family members...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Add Relationship Form */}
                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
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
                            setSelectedMember(option ? option.member : null);
                          }}
                          options={getAvailableMembers().map((member) => ({
                            value: member.id,
                            label: member.name,
                            member: member,
                          }))}
                          formatOptionLabel={(option, { context }) => (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(option.member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{option.label}</span>
                            </div>
                          )}
                          placeholder="Select a family member..."
                          isClearable
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              minHeight: "40px",
                              "&:hover": {
                                borderColor: "#9ca3af",
                              },
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected
                                ? "#3b82f6"
                                : state.isFocused
                                ? "#eff6ff"
                                : "white",
                              color: state.isSelected ? "white" : "black",
                              "&:hover": {
                                backgroundColor: state.isSelected
                                  ? "#2563eb"
                                  : "#f3f4f6",
                              },
                            }),
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Relationship Type</Label>
                        <Select
                          onValueChange={(value) =>
                            setRelationshipType(value as RelationshipType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RelationshipType.PARENT}>
                              {selectedMember?.name || "This person"} is the
                              Parent
                            </SelectItem>
                            <SelectItem value={RelationshipType.CHILD}>
                              {selectedMember?.name || "This person"} is the
                              Child
                            </SelectItem>
                            <SelectItem value={RelationshipType.SPOUSE}>
                              {selectedMember?.name || "This person"} is the
                              Spouse
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        onClick={addRelationship}
                        disabled={!selectedMember || !relationshipType}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Relationship
                      </Button>
                    </div>

                    {/* Existing Relationships */}
                    {relationships.length > 0 && (
                      <div className="space-y-2">
                        <Label>Added Relationships</Label>
                        <div className="space-y-2">
                          {relationships.map((relationship, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(
                                      relationship.relatedMemberName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {relationship.relatedMemberName}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {getRelationshipTypeLabel(
                                      relationship.relationshipType
                                    )}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRelationship(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Personal Information (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  {...register("personalInfo.bio")}
                  placeholder="Brief biography or description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register("personalInfo.birthDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Birth Place</Label>
                  <Input
                    id="birthPlace"
                    {...register("personalInfo.birthPlace")}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    {...register("personalInfo.occupation")}
                    placeholder="Job title or profession"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...register("personalInfo.phoneNumber")}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("personalInfo.email")}
                  placeholder="email@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invitation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Send Invitation (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Send an invitation to allow this family member to join the
                  platform and access the family tree.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInvitation"
                  checked={sendInvitation}
                  onCheckedChange={(checked) =>
                    setSendInvitation(checked as boolean)
                  }
                />
                <Label htmlFor="sendInvitation" className="text-sm font-medium">
                  Send invitation email to this family member
                </Label>
              </div>

              {sendInvitation && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Invitation Permissions
                    </Label>
                    <p className="text-xs text-gray-600">
                      Select what this member can do after joining:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "view_tree", label: "View Family Tree" },
                        { key: "view_members", label: "View Members" },
                        { key: "edit_own_profile", label: "Edit Own Profile" },
                        { key: "add_members", label: "Add Members" },
                        { key: "edit_members", label: "Edit Members" },
                        { key: "send_messages", label: "Send Messages" },
                      ].map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={permission.key}
                            checked={invitationPermissions.includes(
                              permission.key
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setInvitationPermissions((prev) => [
                                  ...prev,
                                  permission.key,
                                ]);
                              } else {
                                setInvitationPermissions((prev) =>
                                  prev.filter((p) => p !== permission.key)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={permission.key} className="text-xs">
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Mail className="h-4 w-4 text-yellow-600" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        Invitation will be sent to:
                      </p>
                      <p className="text-yellow-700">
                        {watch("personalInfo.email") ||
                          "Please enter an email address above"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {createMemberMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <ClipLoader size={16} color="white" />
                  <span>
                    {sendInvitation ? "Creating & Inviting..." : "Creating..."}
                  </span>
                </div>
              ) : sendInvitation ? (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Add & Invite Member</span>
                </div>
              ) : (
                "Create Member"
              )}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </CustomDialog>
  );
}
