import { Controller, Get, Put, Post, Delete, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  findAll(@Req() req: Request, @Query('userId') userId: string, @Query('page') page?: number, @Query('limit') limit?: number, @Query('unreadOnly') unreadOnly?: string) {
    const tenantId = req.headers['x-tenant-id'] as string;
    return this.notificationsService.findAll(tenantId, userId, { page, limit, unreadOnly: unreadOnly === 'true' });
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread count' })
  getUnreadCount(@Req() req: Request, @Query('userId') userId: string) {
    return this.notificationsService.getUnreadCount(req.headers['x-tenant-id'] as string, userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark as read' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all as read' })
  markAllRead(@Req() req: Request, @Body() body: { userId: string }) {
    return this.notificationsService.markAllRead(req.headers['x-tenant-id'] as string, body.userId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  send(@Req() req: Request, @Body() body: { userId: string; type: string; title: string; message: string; channel?: string; data?: any }) {
    return this.notificationsService.send(req.headers['x-tenant-id'] as string, body);
  }
}
