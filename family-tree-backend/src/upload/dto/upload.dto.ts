import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { FileType } from '@prisma/client';

export class FileUploadDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(FileType)
  type: FileType;

  @IsString()
  @IsNotEmpty()
  uploadedBy: string;

  size: number;
}

export class FileResponseDto {
  @IsString()
  id: string;

  @IsString()
  filename: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsString()
  url: string;

  @IsEnum(FileType)
  type: FileType;

  size: number;

  @IsString()
  uploadedBy: string;

  uploadedAt: Date;
}

export class FileUploadResponseDto {
  file: FileResponseDto;
  url: string;
  message: string;
}

export class DeleteFileResponseDto {
  @IsString()
  message: string;
}
