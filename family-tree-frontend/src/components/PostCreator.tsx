"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreatePost, useProfile } from "@/hooks/api";
import { PostVisibility, CreatePostRequest, UploadedFile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import ImageUpload from "@/components/ImageUpload";
import {
  PenSquare,
  Globe,
  Users,
  UserCheck,
  Image,
  Video,
  X,
  Paperclip,
  Sparkles,
  Heart,
  Camera,
  Smile,
  MapPin,
  Tag,
  Lock,
  Eye,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

interface PostForm {
  content: string;
  visibility: PostVisibility;
  familyId?: string;
  imageUrls: string[];
  videoUrl?: string;
}

export default function PostCreator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);

  const { data: profile } = useProfile();
  const createPostMutation = useCreatePost();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostForm>({
    defaultValues: {
      content: "",
      visibility: PostVisibility.FAMILY,
      imageUrls: [],
    },
  });

  const watchedVisibility = watch("visibility");
  const watchedContent = watch("content");
  const watchedFamilyId = watch("familyId");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getVisibilityIcon = (visibility: PostVisibility) => {
    switch (visibility) {
      case PostVisibility.PUBLIC:
        return <Globe className="h-4 w-4" />;
      case PostVisibility.FAMILY:
        return <Users className="h-4 w-4" />;
      case PostVisibility.SUBFAMILY:
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = (visibility: PostVisibility) => {
    switch (visibility) {
      case PostVisibility.PUBLIC:
        return "Public";
      case PostVisibility.FAMILY:
        return "Family";
      case PostVisibility.SUBFAMILY:
        return "Sub-family";
      default:
        return "Family";
    }
  };

  const getVisibilityDescription = (visibility: PostVisibility) => {
    switch (visibility) {
      case PostVisibility.PUBLIC:
        return "🌍 Visible to all users on the platform";
      case PostVisibility.FAMILY:
        return "🏠 Visible to family members only";
      case PostVisibility.SUBFAMILY:
        return "👨‍👩‍👧‍👦 Visible to sub-family members only";
      default:
        return "🏠 Visible to family members only";
    }
  };

  const getVisibilityColor = (visibility: PostVisibility) => {
    switch (visibility) {
      case PostVisibility.PUBLIC:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case PostVisibility.FAMILY:
        return "bg-green-100 text-green-700 border-green-200";
      case PostVisibility.SUBFAMILY:
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const addImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      const newUrls = [...imageUrls, url.trim()];
      setImageUrls(newUrls);
      setValue("imageUrls", newUrls);
    }
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setValue("imageUrls", newUrls);
  };

  const addVideoUrl = () => {
    const url = prompt("Enter video URL:");
    if (url && url.trim()) {
      setVideoUrl(url.trim());
      setValue("videoUrl", url.trim());
    }
  };

  const removeVideoUrl = () => {
    setVideoUrl("");
    setValue("videoUrl", undefined);
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachedFiles((prev) => [...prev, file]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const onSubmit = async (data: PostForm) => {
    if (
      !data.content.trim() &&
      attachedFiles.length === 0 &&
      imageUrls.length === 0 &&
      !videoUrl
    ) {
      toast.error("Please enter some content or attach files");
      return;
    }

    try {
      const postData: CreatePostRequest = {
        content: data.content.trim(),
        visibility: data.visibility,
        imageUrls: imageUrls.filter((url) => url.trim()),
        fileAttachmentIds: attachedFiles.map((file) => file.id),
        videoUrl: videoUrl.trim() || undefined,
        familyId: data.familyId || undefined,
      };

      await createPostMutation.mutateAsync(postData);

      // Reset form
      reset();
      setImageUrls([]);
      setVideoUrl("");
      setAttachedFiles([]);
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleCancel = () => {
    reset();
    setImageUrls([]);
    setVideoUrl("");
    setAttachedFiles([]);
    setIsExpanded(false);
  };

  const getProfileImage = () => {
    return profile?.personalInfo?.profileImage || null;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 border-b border-gray-100/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg shadow-lg">
                <PenSquare className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <Sparkles className="h-2 w-2 text-yellow-900" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Share with your family
              </span>
              <p className="text-sm text-gray-600 mt-1">
                What's happening in your family? 💕
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </div>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Author Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="ring-4 ring-white shadow-lg">
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()!}
                    alt={profile?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                    {profile ? getInitials(profile.name) : "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <div className="bg-white rounded-full p-0.5">
                  <Heart className="h-2 w-2 text-green-500" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{profile?.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs border flex items-center space-x-1 ${getVisibilityColor(
                    watchedVisibility
                  )}`}
                >
                  {getVisibilityIcon(watchedVisibility)}
                  <span>{getVisibilityLabel(watchedVisibility)}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                {...register("content", {
                  validate: (value) => {
                    if (
                      !value?.trim() &&
                      attachedFiles.length === 0 &&
                      imageUrls.length === 0 &&
                      !videoUrl
                    ) {
                      return "Please enter some content or attach files";
                    }
                    return true;
                  },
                })}
                placeholder="Share your family moments, celebrations, or just say hello! ✨"
                className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/50 rounded-xl text-base leading-relaxed"
                onClick={() => setIsExpanded(true)}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-lg">
                {watchedContent.length}/5000
              </div>
            </div>
            {errors.content && (
              <p className="text-red-500 text-sm flex items-center space-x-1">
                <X className="h-4 w-4" />
                <span>{errors.content.message}</span>
              </p>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-100/50">
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addImageUrl}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 rounded-lg"
              >
                <Camera className="h-4 w-4 mr-2" />
                Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addVideoUrl}
                disabled={!!videoUrl}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300 rounded-lg"
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-300 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                More
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {createPostMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <ClipLoader size={16} color="white" />
                    <span>Sharing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Share</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* File Attachments */}
          {(attachedFiles.length > 0 || imageUrls.length > 0 || videoUrl) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700">
                  Attachments
                </h4>
              </div>

              {/* Uploaded Files */}
              {attachedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {file.type === "IMAGE" ? (
                        <div className="relative">
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                            <Image className="h-2 w-2 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-100">
                          <Paperclip className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-2 truncate font-medium">
                        {file.originalName}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleFileRemoved(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Images from URLs */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-image.png";
                        }}
                      />
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <Image className="h-2 w-2 text-white" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => removeImageUrl(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video */}
              {videoUrl && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Video className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        Video URL
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {videoUrl}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeVideoUrl}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expanded Options */}
          {isExpanded && (
            <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-2xl border border-blue-100/50 shadow-inner">
              {/* Privacy Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Privacy Settings
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Who can see this post?
                  </label>
                  <Select
                    value={watchedVisibility}
                    onValueChange={(value: PostVisibility) =>
                      setValue("visibility", value)
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PostVisibility.PUBLIC}>
                        <div className="flex items-center space-x-3 p-2">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">🌍 Public</div>
                            <div className="text-xs text-gray-500">
                              Visible to all users
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={PostVisibility.FAMILY}>
                        <div className="flex items-center space-x-3 p-2">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">🏠 Family</div>
                            <div className="text-xs text-gray-500">
                              Visible to family members
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={PostVisibility.SUBFAMILY}>
                        <div className="flex items-center space-x-3 p-2">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <UserCheck className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">👨‍👩‍👧‍👦 Sub-family</div>
                            <div className="text-xs text-gray-500">
                              Visible to sub-family members
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
                    {getVisibilityDescription(watchedVisibility)}
                  </p>
                </div>

                {/* Family Selection for Family/Sub-family posts */}
                {(watchedVisibility === PostVisibility.FAMILY ||
                  watchedVisibility === PostVisibility.SUBFAMILY) &&
                  profile?.familyMemberships &&
                  profile.familyMemberships.length > 1 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <Heart className="h-4 w-4 mr-2 text-red-500" />
                        Specific Family (Optional)
                      </label>
                      <Select
                        value={watchedFamilyId || ""}
                        onValueChange={(value) =>
                          setValue("familyId", value || undefined)
                        }
                      >
                        <SelectTrigger className="border-gray-200 focus:border-blue-500 bg-white/80">
                          <SelectValue placeholder="All your families" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-families">
                            🌈 All your families
                          </SelectItem>
                          {profile.familyMemberships.map((membership) => (
                            <SelectItem
                              key={membership.familyId}
                              value={membership.familyId}
                            >
                              {membership.familyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </div>

              {/* Media Attachments */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add Media
                  </h3>
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Upload Files
                  </label>
                  <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50">
                    <ImageUpload
                      onFileUploaded={handleFileUploaded}
                      onFileRemoved={handleFileRemoved}
                      existingFiles={attachedFiles}
                      maxFiles={5}
                      maxSizeMB={10}
                      acceptedTypes={[
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "image/webp",
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "video/mp4",
                        "video/webm",
                      ]}
                      variant="compact"
                    />
                  </div>
                </div>

                {/* URL Attachments */}
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageUrl}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Add Image URL
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVideoUrl}
                    disabled={!!videoUrl}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 transition-all duration-300"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Add Video URL
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createPostMutation.isPending}
                  className="border-gray-200 hover:bg-gray-50 transition-all duration-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
