"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile, useUpdateProfile } from "@/hooks/api";
import { updateProfileSchema, UpdateProfileFormData } from "@/schemas/member";
import { Gender, MemberStatus } from "@/types";
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
import { ClipLoader } from "react-spinners";
import { User, Camera } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Set current profile image preview
      if (profile.personalInfo?.profileImage) {
        setPreviewUrl(profile.personalInfo.profileImage);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("[Settings Dialog] File selection event triggered", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.error("[Settings Dialog] File size validation failed", {
          fileSize: file.size,
          maxSize: 10 * 1024 * 1024,
        });
        toast.error("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        console.error("[Settings Dialog] File type validation failed", {
          fileType: file.type,
          allowedTypes,
        });
        toast.error(
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
        );
        return;
      }

      console.log(
        "[Settings Dialog] File validation passed, setting selected file"
      );
      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("[Settings Dialog] Preview URL generated successfully");
        setPreviewUrl(e.target?.result as string);
      };
      reader.onerror = (error) => {
        console.error("[Settings Dialog] Error generating preview URL:", error);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("[Settings Dialog] No file selected");
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(profile?.personalInfo?.profileImage || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    console.log("[Settings Dialog] Form submission started", {
      hasName: !!data.name,
      hasGender: !!data.gender,
      hasStatus: !!data.status,
      hasPersonalInfo: !!data.personalInfo,
      hasFile: !!selectedFile,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
    });

    try {
      console.log("[Settings Dialog] Creating FormData");
      const formData = new FormData();

      // Add form data
      formData.append("name", data.name || "");
      if (data.gender) formData.append("gender", data.gender);
      if (data.status) formData.append("status", data.status);

      // Add personal info
      if (data.personalInfo) {
        console.log("[Settings Dialog] Adding personal info to FormData");
        if (data.personalInfo.bio)
          formData.append("personalInfo[bio]", data.personalInfo.bio);
        if (data.personalInfo.birthDate)
          formData.append(
            "personalInfo[birthDate]",
            data.personalInfo.birthDate
          );
        if (data.personalInfo.birthPlace)
          formData.append(
            "personalInfo[birthPlace]",
            data.personalInfo.birthPlace
          );
        if (data.personalInfo.occupation)
          formData.append(
            "personalInfo[occupation]",
            data.personalInfo.occupation
          );
        if (data.personalInfo.phoneNumber)
          formData.append(
            "personalInfo[phoneNumber]",
            data.personalInfo.phoneNumber
          );
        if (data.personalInfo.email)
          formData.append("personalInfo[email]", data.personalInfo.email);

        // Add social links
        if (data.personalInfo.socialLinks) {
          console.log("[Settings Dialog] Adding social links to FormData");
          if (data.personalInfo.socialLinks.facebook)
            formData.append(
              "personalInfo[socialLinks][facebook]",
              data.personalInfo.socialLinks.facebook
            );
          if (data.personalInfo.socialLinks.twitter)
            formData.append(
              "personalInfo[socialLinks][twitter]",
              data.personalInfo.socialLinks.twitter
            );
          if (data.personalInfo.socialLinks.linkedin)
            formData.append(
              "personalInfo[socialLinks][linkedin]",
              data.personalInfo.socialLinks.linkedin
            );
          if (data.personalInfo.socialLinks.instagram)
            formData.append(
              "personalInfo[socialLinks][instagram]",
              data.personalInfo.socialLinks.instagram
            );
        }
      }

      // Add file if selected
      if (selectedFile) {
        console.log("[Settings Dialog] Adding file to FormData");
        formData.append("profileImage", selectedFile);
      }

      console.log("[Settings Dialog] Calling API mutation");
      await updateProfileMutation.mutateAsync(formData);

      console.log("[Settings Dialog] Profile update successful");
      // Show success notification
      toast.success("Profile updated successfully!");

      // Reset form state
      setSelectedFile(null);

      // Close dialog after a brief delay to show the success message
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error("[Settings Dialog] Profile update failed:", error);
      toast.error("Failed to update profile. Please try again.");
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
      <CustomDialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[95vh] overflow-y-auto">
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
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {profile ? getInitials(profile.name) : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm text-gray-600">
                  {selectedFile ? "New Photo Selected" : "Current Photo"}
                </span>
              </div>

              {/* File Input */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFileRemove}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Select a new profile photo (JPEG, PNG, GIF, or WebP, max 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
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
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
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
