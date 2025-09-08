"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useLikePost, useProfile } from "@/hooks/api";
import { Post, PostVisibility, FileType } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CommentSection from "./CommentSection";
import {
  Heart,
  MessageCircle,
  Share2,
  Globe,
  Users,
  UserCheck,
  MoreHorizontal,
  Download,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Eye,
  Sparkles,
  Clock,
  MapPin,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);

  const { data: profile } = useProfile();
  const likePostMutation = useLikePost();

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
        return <Globe className="h-3 w-3" />;
      case PostVisibility.FAMILY:
        return <Users className="h-3 w-3" />;
      case PostVisibility.SUBFAMILY:
        return <UserCheck className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
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

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case FileType.IMAGE:
        return <ImageIcon className="h-4 w-4" />;
      case FileType.VIDEO:
        return <Video className="h-4 w-4" />;
      case FileType.AUDIO:
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = (fileType: FileType) => {
    switch (fileType) {
      case FileType.IMAGE:
        return "text-green-600 bg-green-50";
      case FileType.VIDEO:
        return "text-purple-600 bg-purple-50";
      case FileType.AUDIO:
        return "text-orange-600 bg-orange-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleLike = async () => {
    try {
      await likePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author.name}`,
        text:
          post.content.substring(0, 100) +
          (post.content.length > 100 ? "..." : ""),
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOwnPost = profile?.id === post.authorId;
  const authorProfileImage = post.author.personalInfo?.profileImage;

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-gray-100/50">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="ring-4 ring-white shadow-lg">
                  {authorProfileImage ? (
                    <img
                      src={authorProfileImage}
                      alt={post.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                      {getInitials(post.author.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <div className="bg-white rounded-full p-0.5">
                    <Sparkles className="h-2 w-2 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold text-gray-900 text-lg">
                    {post.author.name}
                  </h4>
                  {isOwnPost && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs border flex items-center space-x-1",
                      getVisibilityColor(post.visibility)
                    )}
                  >
                    {getVisibilityIcon(post.visibility)}
                    <span>{getVisibilityLabel(post.visibility)}</span>
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isOwnPost && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-300"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Post Content */}
        {post.content && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl p-4 border border-gray-100/50">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
              {post.content}
            </p>
          </div>
        )}

        {/* File Attachments */}
        {post.fileAttachments && post.fileAttachments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-700">
                Attachments
              </h4>
            </div>
            <div className="grid gap-3">
              {post.fileAttachments.map((file) => (
                <div
                  key={file.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {file.type === FileType.IMAGE ? (
                        <div className="relative">
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-16 h-16 rounded-lg object-cover shadow-sm"
                          />
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                            <ImageIcon className="h-2 w-2 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "w-16 h-16 rounded-lg flex items-center justify-center shadow-sm",
                            getFileTypeColor(file.type)
                          )}
                        >
                          {getFileIcon(file.type)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {file.originalName}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {file.type}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownloadFile(file.url, file.originalName)
                        }
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-300"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Content from URLs */}
        {post.imageUrls.length > 0 && (
          <div className="space-y-3">
            {post.imageUrls.length === 1 ? (
              <div className="relative group">
                <img
                  src={post.imageUrls[0]}
                  alt="Post attachment"
                  className="w-full max-h-96 object-cover rounded-2xl shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-3 rounded-2xl overflow-hidden",
                  post.imageUrls.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 grid-rows-2"
                )}
              >
                {post.imageUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Post attachment ${index + 1}`}
                      className="w-full h-32 object-cover shadow-sm hover:shadow-md transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {index === 3 && post.imageUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                        <span className="text-white font-bold text-lg">
                          +{post.imageUrls.length - 4}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Content */}
        {post.videoUrl && (
          <div className="relative group">
            <video
              src={post.videoUrl}
              controls
              className="w-full max-h-96 rounded-2xl shadow-lg"
              onError={(e) => {
                (e.target as HTMLVideoElement).style.display = "none";
              }}
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        )}

        {/* Engagement Stats */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <div className="flex items-center justify-between text-sm bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
            <div className="flex items-center space-x-6">
              {post.likesCount > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
                  </span>
                </div>
              )}
              {post.commentsCount > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {post.commentsCount}{" "}
                    {post.commentsCount === 1 ? "comment" : "comments"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likePostMutation.isPending}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105",
                post.isLikedByCurrentUser
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  post.isLikedByCurrentUser && "fill-current"
                )}
              />
              <span className="font-medium">Like</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-600 transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">Comment</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-600 transition-all duration-300 hover:scale-105"
            >
              <Share2 className="h-4 w-4" />
              <span className="font-medium">Share</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-6 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-blue-50/30 rounded-xl p-4">
            <CommentSection postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
