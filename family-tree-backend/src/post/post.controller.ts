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
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto, PostResponseDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully', type: PostResponseDto })
  async createPost(
    @CurrentUser('memberId') memberId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postService.createPost(memberId, createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get posts feed with pagination' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async getPosts(
    @CurrentUser('memberId') memberId: string,
    @Query() query: PostQueryDto,
  ) {
    return this.postService.getPosts(memberId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post with comments' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully', type: PostResponseDto })
  async getPostById(
    @Param('id') postId: string,
    @CurrentUser('memberId') memberId: string,
  ) {
    return this.postService.getPostById(postId, memberId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully', type: PostResponseDto })
  async updatePost(
    @Param('id') postId: string,
    @CurrentUser('memberId') memberId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(postId, memberId, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser('memberId') memberId: string,
  ) {
    return this.postService.deletePost(postId, memberId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiResponse({ status: 200, description: 'Post like toggled successfully' })
  async likePost(
    @Param('id') postId: string,
    @CurrentUser('memberId') memberId: string,
  ) {
    return this.postService.likePost(postId, memberId);
  }
}
