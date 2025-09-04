'use client';

import { useState, useRef, useCallback } from 'react';
import { useUploadFile, useDeleteFile } from '@/hooks/api';
import { UploadedFile, FileType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipLoader } from 'react-spinners';
import { Upload, X, Image, FileText, Video, Music, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onFileUploaded?: (file: UploadedFile) => void;
  onFileRemoved?: (fileId: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  existingFiles?: UploadedFile[];
  variant?: 'default' | 'profile' | 'compact';
  className?: string;
}

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ACCEPTED_FILE_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'audio/mp3',
  'audio/wav'
];

export default function ImageUpload({
  onFileUploaded,
  onFileRemoved,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ACCEPTED_IMAGE_TYPES,
  existingFiles = [],
  variant = 'default',
  className
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileMutation = useUploadFile();
  const deleteFileMutation = useDeleteFile();

  const getFileIcon = (file: UploadedFile) => {
    switch (file.type) {
      case FileType.IMAGE:
        return <Image className="h-4 w-4" />;
      case FileType.VIDEO:
        return <Video className="h-4 w-4" />;
      case FileType.AUDIO:
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`File type ${file.type} is not supported`);
      return false;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    // Check max files
    if (existingFiles.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return false;
    }

    return true;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(validateFile);

    for (const file of validFiles) {
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadingFiles(prev => new Set([...prev, fileId]));

      try {
        const uploadedFile = await uploadFileMutation.mutateAsync(file);
        onFileUploaded?.(uploadedFile.file);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
  }, [uploadFileMutation, onFileUploaded, maxFiles, existingFiles.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleRemoveFile = async (file: UploadedFile) => {
    try {
      await deleteFileMutation.mutateAsync(file.id);
      onFileRemoved?.(file.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (variant === 'profile') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center space-x-4">
          {existingFiles.length > 0 && (
            <div className="relative">
              <img
                src={existingFiles[0].url}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
                onClick={() => handleRemoveFile(existingFiles[0])}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={openFileDialog}
              disabled={uploadFileMutation.isPending || existingFiles.length >= maxFiles}
            >
              {uploadFileMutation.isPending ? (
                <ClipLoader size={16} color="currentColor" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {existingFiles.length > 0 ? 'Change Photo' : 'Upload Photo'}
            </Button>

            <p className="text-xs text-gray-500">
              JPG, PNG or GIF up to {maxSizeMB}MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          multiple={maxFiles > 1}
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={uploadFileMutation.isPending || existingFiles.length >= maxFiles}
        >
          {uploadFileMutation.isPending ? (
            <ClipLoader size={14} color="currentColor" />
          ) : (
            <Upload className="h-3 w-3 mr-1" />
          )}
          Attach
        </Button>

        {existingFiles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {existingFiles.map((file) => (
              <Badge key={file.id} variant="secondary" className="text-xs">
                {getFileIcon(file)}
                <span className="ml-1 truncate max-w-20">{file.originalName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 ml-1"
                  onClick={() => handleRemoveFile(file)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          multiple={maxFiles > 1}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
          "hover:border-gray-400 cursor-pointer"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {acceptedTypes.includes('image/jpeg') ? 'Images' : 'Files'} up to {maxSizeMB}MB
              {maxFiles > 1 && ` (max ${maxFiles} files)`}
            </p>
          </div>

          {uploadFileMutation.isPending && (
            <div className="mt-4">
              <ClipLoader size={20} color="#3B82F6" />
              <p className="text-xs text-gray-500 mt-2">Uploading...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {file.type === FileType.IMAGE ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file);
                    }}
                    disabled={deleteFileMutation.isPending}
                  >
                    {deleteFileMutation.isPending ? (
                      <ClipLoader size={14} color="currentColor" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        multiple={maxFiles > 1}
      />
    </div>
  );
}
