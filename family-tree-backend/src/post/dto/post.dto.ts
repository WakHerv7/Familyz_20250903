import { IsString, IsOptional, IsEnum, IsArray, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({ description: 'Post content', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Array of image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ description: 'Post visibility', enum: PostVisibility })
  @IsEnum(PostVisibility)
  visibility: PostVisibility;

  @ApiPropertyOptional({ description: 'Family ID for family-specific posts' })
  @IsOptional()
  @IsUUID()
  familyId?: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'Post content', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Array of image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ description: 'Post visibility', enum: PostVisibility })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}

export class PostQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by family ID' })
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @ApiPropertyOptional({ description: 'Filter by visibility', enum: PostVisibility })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @ApiProperty()
  videoUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ enum: PostVisibility })
  visibility: PostVisibility;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  familyId: string | null;

  @ApiProperty()
  author: {
    id: string;
    name: string;
    personalInfo: any;
  };

  @ApiProperty()
  isLikedByCurrentUser?: boolean;

  @ApiProperty()
  commentsCount?: number;
}
