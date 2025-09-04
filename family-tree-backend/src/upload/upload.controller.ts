import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { File } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    memberId: string;
  };
}

interface FileUploadResponse {
  file: File;
  url: string;
  message: string;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<FileUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadedFile = await this.uploadService.uploadFile(
      file,
      req.user.memberId,
    );

    return {
      file: uploadedFile,
      url: uploadedFile.url,
      message: 'File uploaded successfully',
    };
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<FileUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadProfileImage(
      file,
      req.user.memberId,
    );

    return {
      file: result.file,
      url: result.file.url,
      message: 'Profile image uploaded successfully',
    };
  }

  @Delete(':fileId')
  async deleteFile(
    @Param('fileId') fileId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.uploadService.deleteFile(fileId, req.user.memberId);
  }

  @Get(':fileId')
  async getFile(@Param('fileId') fileId: string): Promise<File> {
    return await this.uploadService.getFile(fileId);
  }

  @Get('user/files')
  async getUserFiles(@Request() req: AuthenticatedRequest): Promise<File[]> {
    return await this.uploadService.getUserFiles(req.user.memberId);
  }
}
