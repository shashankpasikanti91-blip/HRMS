import { Controller, Get, Post, Put, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationRouteController {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  getNotifications(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('notifications.findAll', query));
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Unread notification count' })
  getUnreadCount(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('notifications.unreadCount', query));
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return firstValueFrom(this.client.send('notifications.markRead', { id }));
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('notifications.markAllRead', body));
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  sendNotification(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('notifications.send', body));
  }

  // ── Announcements ──
  @Get('announcements')
  @ApiOperation({ summary: 'List announcements' })
  getAnnouncements(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('announcements.findAll', query));
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create announcement' })
  createAnnouncement(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('announcements.create', body));
  }

  @Put('announcements/:id')
  @ApiOperation({ summary: 'Update announcement' })
  updateAnnouncement(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('announcements.update', { id, ...body }));
  }
}
