import {
  Controller,
  Get,
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
import { NotificationService } from './notification.service';
import { NotificationQueryDto, MarkNotificationReadDto, NotificationResponseDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @CurrentUser('memberId') memberId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getNotifications(memberId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@CurrentUser('memberId') memberId: string) {
    return this.notificationService.getUnreadCount(memberId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read/unread' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully', type: NotificationResponseDto })
  async markNotificationRead(
    @Param('id') notificationId: string,
    @CurrentUser('memberId') memberId: string,
    @Body() markReadDto: MarkNotificationReadDto,
  ) {
    return this.notificationService.markNotificationRead(notificationId, memberId, markReadDto);
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllNotificationsRead(@CurrentUser('memberId') memberId: string) {
    return this.notificationService.markAllNotificationsRead(memberId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser('memberId') memberId: string,
  ) {
    return this.notificationService.deleteNotification(notificationId, memberId);
  }

  @Delete('read/clear')
  @ApiOperation({ summary: 'Clear all read notifications' })
  @ApiResponse({ status: 200, description: 'Read notifications cleared successfully' })
  async deleteAllReadNotifications(@CurrentUser('memberId') memberId: string) {
    return this.notificationService.deleteAllReadNotifications(memberId);
  }
}
