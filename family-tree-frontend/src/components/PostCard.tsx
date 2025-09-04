'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLikePost, useProfile } from '@/hooks/api';
import { Post, PostVisibility, FileType } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import CommentSection from './CommentSection';
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
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);

  const { data: profile } = useProfile();
  const likePostMutation = useLikePost();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
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
        return 'Public';
      case PostVisibility.FAMILY:
        return 'Family';
      case PostVisibility.SUBFAMILY:
        return 'Sub-family';
      default:
        return 'Family';
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
        return 'text-green-600';
      case FileType.VIDEO:
        return 'text-purple-600';
      case FileType.AUDIO:
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleLike = async () => {
    try {
      await likePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author.name}`,
        text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOwnPost = profile?.id === post.authorId;
  const authorProfileImage = post.author.personalInfo?.profileImage;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              {authorProfileImage ? (
                <img
                  src={authorProfileImage}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback>
                  {getInitials(post.author.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{post.author.name}</h4>
                {isOwnPost && <Badge variant="outline" className="text-xs">You</Badge>}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  {getVisibilityIcon(post.visibility)}
                  <span>{getVisibilityLabel(post.visibility)}</span>
                </div>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {isOwnPost && (
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        {post.content && (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* File Attachments */}
        {post.fileAttachments && post.fileAttachments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
            <div className="grid gap-3">
              {post.fileAttachments.map((file) => (
                <div key={file.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {file.type === FileType.IMAGE ? (
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className={cn(
                          "w-12 h-12 rounded bg-gray-100 flex items-center justify-center",
                          getFileTypeColor(file.type)
                        )}>
                          {getFileIcon(file.type)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.originalName}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{file.type}</span>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file.url, file.originalName)}
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
          <div className="space-y-2">
            {post.imageUrls.length === 1 ? (
              <img
                src={post.imageUrls[0]}
                alt="Post attachment"
                className="w-full max-h-96 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className={cn(
                "grid gap-2 rounded-lg overflow-hidden",
                post.imageUrls.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"
              )}>
                {post.imageUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Post attachment ${index + 1}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {index === 3 && post.imageUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{post.imageUrls.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Content */}
        {post.videoUrl && (
          <div className="rounded-lg overflow-hidden">
            <video
              src={post.videoUrl}
              controls
              className="w-full max-h-96"
              onError={(e) => {
                (e.target as HTMLVideoElement).style.display = 'none';
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Engagement Stats */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <div className="flex items-center justify-between text-sm text-gray-600 py-2 border-y">
            <div className="flex items-center space-x-4">
              {post.likesCount > 0 && (
                <span className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  <span>{post.likesCount}</span>
                </span>
              )}
            </div>
            {post.commentsCount > 0 && (
              <span className="cursor-pointer" onClick={() => setShowComments(!showComments)}>
                {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likePostMutation.isPending}
              className={cn(
                "flex items-center space-x-2",
                post.isLikedByCurrentUser && "text-red-500"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  post.isLikedByCurrentUser && "fill-current"
                )}
              />
              <span>Like</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-4 border-t">
            <CommentSection postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
