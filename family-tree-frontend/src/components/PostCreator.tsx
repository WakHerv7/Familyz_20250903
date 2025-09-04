'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePost, useProfile } from '@/hooks/api';
import { PostVisibility, CreatePostRequest, UploadedFile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ClipLoader } from 'react-spinners';
import ImageUpload from '@/components/ImageUpload';
import { PenSquare, Globe, Users, UserCheck, Image, Video, X, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [videoUrl, setVideoUrl] = useState('');
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
      content: '',
      visibility: PostVisibility.FAMILY,
      imageUrls: [],
    },
  });

  const watchedVisibility = watch('visibility');
  const watchedContent = watch('content');
  const watchedFamilyId = watch('familyId');

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
        return 'Public';
      case PostVisibility.FAMILY:
        return 'Family';
      case PostVisibility.SUBFAMILY:
        return 'Sub-family';
      default:
        return 'Family';
    }
  };

  const getVisibilityDescription = (visibility: PostVisibility) => {
    switch (visibility) {
      case PostVisibility.PUBLIC:
        return 'Visible to all users on the platform';
      case PostVisibility.FAMILY:
        return 'Visible to family members only';
      case PostVisibility.SUBFAMILY:
        return 'Visible to sub-family members only';
      default:
        return 'Visible to family members only';
    }
  };

  const addImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      const newUrls = [...imageUrls, url.trim()];
      setImageUrls(newUrls);
      setValue('imageUrls', newUrls);
    }
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setValue('imageUrls', newUrls);
  };

  const addVideoUrl = () => {
    const url = prompt('Enter video URL:');
    if (url && url.trim()) {
      setVideoUrl(url.trim());
      setValue('videoUrl', url.trim());
    }
  };

  const removeVideoUrl = () => {
    setVideoUrl('');
    setValue('videoUrl', undefined);
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const onSubmit = async (data: PostForm) => {
    if (!data.content.trim() && attachedFiles.length === 0 && imageUrls.length === 0 && !videoUrl) {
      toast.error('Please enter some content or attach files');
      return;
    }

    try {
      const postData: CreatePostRequest = {
        content: data.content.trim(),
        visibility: data.visibility,
        imageUrls: imageUrls.filter(url => url.trim()),
        fileAttachmentIds: attachedFiles.map(file => file.id),
        videoUrl: videoUrl.trim() || undefined,
        familyId: data.familyId || undefined,
      };

      await createPostMutation.mutateAsync(postData);

      // Reset form
      reset();
      setImageUrls([]);
      setVideoUrl('');
      setAttachedFiles([]);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleCancel = () => {
    reset();
    setImageUrls([]);
    setVideoUrl('');
    setAttachedFiles([]);
    setIsExpanded(false);
  };

  const getProfileImage = () => {
    return profile?.personalInfo?.profileImage || null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <PenSquare className="h-5 w-5" />
          <span>Share with your family</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar>
              {getProfileImage() ? (
                <img
                  src={getProfileImage()!}
                  alt={profile?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback>
                  {profile ? getInitials(profile.name) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium">{profile?.name}</p>
              <div className="flex items-center space-x-1">
                {getVisibilityIcon(watchedVisibility)}
                <span className="text-sm text-gray-600">
                  {getVisibilityLabel(watchedVisibility)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Textarea
              {...register('content', {
                validate: (value) => {
                  if (!value?.trim() && attachedFiles.length === 0 && imageUrls.length === 0 && !videoUrl) {
                    return 'Please enter some content or attach files';
                  }
                  return true;
                }
              })}
              placeholder="What's happening in your family?"
              className="min-h-[80px] resize-none"
              onClick={() => setIsExpanded(true)}
            />
            {errors.content && (
              <p className="text-red-500 text-sm">{errors.content.message}</p>
            )}
          </div>

          {/* File Attachments */}
          {(attachedFiles.length > 0 || imageUrls.length > 0 || videoUrl) && (
            <div className="space-y-3">
              {/* Uploaded Files */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attached Files</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="relative">
                        {file.type === 'IMAGE' ? (
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Paperclip className="h-6 w-6 text-gray-500" />
                            <span className="text-xs text-gray-600 ml-1 truncate">
                              {file.originalName}
                            </span>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
                          onClick={() => handleFileRemoved(file.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images from URLs */}
              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Images</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImageUrl(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video */}
              {videoUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video</label>
                  <div className="relative">
                    <div className="flex items-center space-x-2 p-2 border rounded-lg">
                      <Video className="h-4 w-4" />
                      <span className="text-sm truncate flex-1">{videoUrl}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeVideoUrl}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expanded Options */}
          {isExpanded && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Privacy Settings */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Who can see this?</label>
                  <Select
                    value={watchedVisibility}
                    onValueChange={(value: PostVisibility) => setValue('visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PostVisibility.PUBLIC}>
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <div>
                            <div>Public</div>
                            <div className="text-xs text-gray-500">
                              Visible to all users
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={PostVisibility.FAMILY}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div>Family</div>
                            <div className="text-xs text-gray-500">
                              Visible to family members
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={PostVisibility.SUBFAMILY}>
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4" />
                          <div>
                            <div>Sub-family</div>
                            <div className="text-xs text-gray-500">
                              Visible to sub-family members
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    {getVisibilityDescription(watchedVisibility)}
                  </p>
                </div>

                {/* Family Selection for Family/Sub-family posts */}
                {(watchedVisibility === PostVisibility.FAMILY || watchedVisibility === PostVisibility.SUBFAMILY) &&
                 profile?.familyMemberships && profile.familyMemberships.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Specific Family (Optional)</label>
                    <Select
                      value={watchedFamilyId || ''}
                      onValueChange={(value) => setValue('familyId', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All your families" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All your families</SelectItem>
                        {profile.familyMemberships.map((membership) => (
                          <SelectItem key={membership.familyId} value={membership.familyId}>
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
                <label className="text-sm font-medium">Add to your post</label>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Upload Files</label>
                  <ImageUpload
                    onFileUploaded={handleFileUploaded}
                    onFileRemoved={handleFileRemoved}
                    existingFiles={attachedFiles}
                    maxFiles={5}
                    maxSizeMB={10}
                    acceptedTypes={[
                      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                      'application/pdf', 'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'video/mp4', 'video/webm'
                    ]}
                    variant="compact"
                  />
                </div>

                {/* URL Attachments */}
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImageUrl}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    Image URL
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVideoUrl}
                    disabled={!!videoUrl}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video URL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">
              {watchedContent.length}/5000 characters
            </div>
            <div className="flex items-center space-x-2">
              {isExpanded && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createPostMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <ClipLoader size={16} color="white" />
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
