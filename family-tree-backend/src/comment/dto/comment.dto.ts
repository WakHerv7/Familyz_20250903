import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'Optional image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Comment content', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ description: 'Optional image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CommentQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Include replies' })
  @IsOptional()
  includeReplies?: boolean = true;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  imageUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  parentCommentId: string | null;

  @ApiProperty()
  author: {
    id: string;
    name: string;
    personalInfo: any;
  };

  @ApiProperty({ type: [CommentResponseDto] })
  replies?: CommentResponseDto[];

  @ApiProperty()
  isLikedByCurrentUser?: boolean;
}
