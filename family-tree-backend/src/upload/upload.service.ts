import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { File, FileType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    return FileType.DOCUMENT;
  }

  private getFileUrl(filename: string): string {
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3001';
    return `${baseUrl}/uploads/${filename}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const fileType = this.getFileType(file.mimetype);
      const fileUrl = this.getFileUrl(file.filename);

      const uploadedFile = await this.prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: fileUrl,
          type: fileType,
          uploadedBy,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return uploadedFile;
    } catch (error) {
      // If database operation fails, clean up the uploaded file
      if (file.filename) {
        const filePath = path.join('./uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      throw error;
    }
  }

  async uploadProfileImage(
    file: Express.Multer.File,
    memberId: string,
  ): Promise<{ file: File; profileUpdated: boolean }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate that it's an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Profile image must be an image file');
    }

    const uploadedFile = await this.uploadFile(file, memberId);

    // Update member's profile info with the new image
    try {
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
        select: { personalInfo: true },
      });

      if (!member) {
        throw new NotFoundException('Member not found');
      }

      const personalInfo = member.personalInfo as any || {};
      const oldProfileImageId = personalInfo.profileImageId;

      // Update personal info with new profile image
      await this.prisma.member.update({
        where: { id: memberId },
        data: {
          personalInfo: {
            ...personalInfo,
            profileImage: uploadedFile.url,
            profileImageId: uploadedFile.id,
          },
        },
      });

      // Delete old profile image if it exists
      if (oldProfileImageId) {
        try {
          await this.deleteFile(oldProfileImageId, memberId);
        } catch (error) {
          // Don't fail the upload if old image deletion fails
          console.warn('Failed to delete old profile image:', error);
        }
      }

      return { file: uploadedFile, profileUpdated: true };
    } catch (error) {
      // If profile update fails, clean up the uploaded file
      await this.deleteFile(uploadedFile.id, memberId);
      throw error;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<{ message: string }> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check if user owns the file
    if (file.uploadedBy !== userId) {
      throw new BadRequestException('You can only delete your own files');
    }

    // Delete file from filesystem
    const filePath = path.join('./uploads', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file record from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  async getFile(fileId: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async getUserFiles(userId: string): Promise<File[]> {
    return await this.prisma.file.findMany({
      where: { uploadedBy: userId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
