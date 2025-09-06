"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useProfile,
  useUpdateProfile,
  useUploadProfileImage,
} from "@/hooks/api";
import { updateProfileSchema, UpdateProfileFormData } from "@/schemas/member";
import { Gender, MemberStatus, UploadedFile } from "@/types";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ImageUpload from "@/components/ImageUpload";
import { ClipLoader } from "react-spinners";
import { User, Camera } from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadProfileImageMutation = useUploadProfileImage();
  const [profileImageFiles, setProfileImageFiles] = useState<UploadedFile[]>(
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Initialize form with current profile data
  useEffect(() => {
    if (profile && open) {
      reset({
        name: profile.name,
        gender: profile.gender,
        status: profile.status,
        personalInfo: {
          bio: profile.personalInfo?.bio || "",
          birthDate: profile.personalInfo?.birthDate || "",
          birthPlace: profile.personalInfo?.birthPlace || "",
          occupation: profile.personalInfo?.occupation || "",
          phoneNumber: profile.personalInfo?.phoneNumber || "",
          email: profile.personalInfo?.email || "",
          socialLinks: {
            facebook: profile.personalInfo?.socialLinks?.facebook || "",
            twitter: profile.personalInfo?.socialLinks?.twitter || "",
            linkedin: profile.personalInfo?.socialLinks?.linkedin || "",
            instagram: profile.personalInfo?.socialLinks?.instagram || "",
          },
        },
      });

      // Set profile image if exists
      if (profile.personalInfo?.profileImage) {
        setProfileImageFiles([
          {
            id: profile.personalInfo.profileImageId || "current",
            filename: "profile-image",
            originalName: "Profile Image",
            mimeType: "image/jpeg",
            size: 0,
            url: profile.personalInfo.profileImage,
            type: "IMAGE" as any,
            uploadedBy: profile.id,
            uploadedAt: new Date(),
          },
        ]);
      }
    }
  }, [profile, open, reset]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileImageUploaded = (file: UploadedFile) => {
    setProfileImageFiles([file]);
    // Update the profile with the new image
    if (profile) {
      updateProfileMutation.mutate({
        personalInfo: {
          ...profile.personalInfo,
          profileImage: file.url,
          profileImageId: file.id,
        },
      });
    }
  };

  const handleProfileImageRemoved = (fileId: string) => {
    setProfileImageFiles([]);
    // Update the profile to remove the image
    if (profile) {
      updateProfileMutation.mutate({
        personalInfo: {
          ...profile.personalInfo,
          profileImage: undefined,
          profileImageId: undefined,
        },
      });
    }
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      // Clean up social links - remove empty strings
      const cleanedSocialLinks = data.personalInfo?.socialLinks
        ? {
            facebook: data.personalInfo.socialLinks.facebook || undefined,
            twitter: data.personalInfo.socialLinks.twitter || undefined,
            linkedin: data.personalInfo.socialLinks.linkedin || undefined,
            instagram: data.personalInfo.socialLinks.instagram || undefined,
          }
        : undefined;

      // Prepare updated personal info
      const updatedPersonalInfo = data.personalInfo
        ? {
            ...data.personalInfo,
            socialLinks: cleanedSocialLinks,
            // Preserve existing profile image data
            profileImage: profile?.personalInfo?.profileImage,
            profileImageId: profile?.personalInfo?.profileImageId,
          }
        : undefined;

      await updateProfileMutation.mutateAsync({
        name: data.name,
        gender: data.gender,
        status: data.status,
        personalInfo: updatedPersonalInfo,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (isLoading) {
    return (
      <CustomDialog open={open} onOpenChange={onOpenChange}>
        <CustomDialogContent>
          <div className="flex items-center justify-center py-8">
            <ClipLoader size={32} color="#3B82F6" />
          </div>
        </CustomDialogContent>
      </CustomDialog>
    );
  }

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader>
          <CustomDialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Settings</span>
          </CustomDialogTitle>
          <CustomDialogDescription>
            Update your personal information and family tree profile.
          </CustomDialogDescription>
          <CustomDialogClose onClick={() => onOpenChange(false)} />
        </CustomDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Profile Photo</span>
            </Label>

            <div className="flex items-start space-x-6">
              {/* Current Profile Display */}
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-20 w-20">
                  {profileImageFiles.length > 0 ? (
                    <img
                      src={profileImageFiles[0].url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {profile ? getInitials(profile.name) : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm text-gray-600">Current Photo</span>
              </div>

              {/* Image Upload */}
              <div className="flex-1">
                <ImageUpload
                  onFileUploaded={handleProfileImageUploaded}
                  onFileRemoved={handleProfileImageRemoved}
                  existingFiles={profileImageFiles}
                  maxFiles={1}
                  maxSizeMB={5}
                  acceptedTypes={[
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp",
                  ]}
                  variant="profile"
                />
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Basic Information</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  onValueChange={(value) => setValue("gender", value as Gender)}
                  defaultValue={profile?.gender}
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) =>
                  setValue("status", value as MemberStatus)
                }
                defaultValue={profile?.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={MemberStatus.INACTIVE}>
                    Inactive
                  </SelectItem>
                  <SelectItem value={MemberStatus.DECEASED}>
                    Deceased
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Personal Information
            </Label>

            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                {...register("personalInfo.bio")}
                placeholder="Tell us about yourself"
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

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                {...register("personalInfo.occupation")}
                placeholder="Your profession or job title"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Contact Information</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...register("personalInfo.phoneNumber")}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("personalInfo.email")}
                  placeholder="your.email@example.com"
                />
                {errors.personalInfo?.email && (
                  <p className="text-red-500 text-sm">
                    {errors.personalInfo.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Social Media (Optional)
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  {...register("personalInfo.socialLinks.facebook")}
                  placeholder="https://facebook.com/yourprofile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  {...register("personalInfo.socialLinks.twitter")}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  {...register("personalInfo.socialLinks.linkedin")}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  {...register("personalInfo.socialLinks.instagram")}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={
                updateProfileMutation.isPending ||
                uploadProfileImageMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateProfileMutation.isPending ||
                uploadProfileImageMutation.isPending
              }
            >
              {updateProfileMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <ClipLoader size={16} color="white" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </CustomDialog>
  );
}
