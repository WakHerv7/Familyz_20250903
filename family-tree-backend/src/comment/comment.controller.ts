import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto, CommentResponseDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Comments')
@Controller('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiResponse({ status: 201, description: 'Comment created successfully', type: CommentResponseDto })
  async createComment(
    @Param('postId') postId: string,
    @CurrentUser('memberId') memberId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createComment(postId, memberId, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getComments(
    @Param('postId') postId: string,
    @CurrentUser('memberId') memberId: string,
    @Query() query: CommentQueryDto,
  ) {
    return this.commentService.getCommentsByPost(postId, memberId, query);
  }
}

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentManagementController {
  constructor(private readonly commentService: CommentService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully', type: CommentResponseDto })
  async updateComment(
    @Param('id') commentId: string,
    @CurrentUser('memberId') memberId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(commentId, memberId, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  async deleteComment(
    @Param('id') commentId: string,
    @CurrentUser('memberId') memberId: string,
  ) {
    return this.commentService.deleteComment(commentId, memberId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a comment' })
  @ApiResponse({ status: 200, description: 'Comment like toggled successfully' })
  async likeComment(
    @Param('id') commentId: string,
    @CurrentUser('memberId') memberId: string,
  ) {
    return this.commentService.likeComment(commentId, memberId);
  }
}
