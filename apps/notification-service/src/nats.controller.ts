// ============================================================
// SRP AI HRMS - Notification NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './modules/notifications/notifications.service';
import { AnnouncementsService } from './modules/announcements/announcements.service';

@Controller()
export class NotificationNatsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  // ── Notifications ──

  @MessagePattern('notifications.findAll')
  async findAll(@Payload() data: any) {
    return this.notificationsService.findAll(data.tenantId, data.userId, data);
  }

  @MessagePattern('notifications.unreadCount')
  async getUnreadCount(@Payload() data: any) {
    return this.notificationsService.getUnreadCount(data.tenantId, data.userId);
  }

  @MessagePattern('notifications.markRead')
  async markRead(@Payload() data: any) {
    return this.notificationsService.markRead(data.id);
  }

  @MessagePattern('notifications.markAllRead')
  async markAllRead(@Payload() data: any) {
    return this.notificationsService.markAllRead(data.tenantId, data.userId);
  }

  @MessagePattern('notifications.send')
  async send(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.notificationsService.send(tenantId, dto);
  }

  // ── Announcements ──

  @MessagePattern('announcements.findAll')
  async findAllAnnouncements(@Payload() data: any) {
    return this.announcementsService.findAll(data.tenantId, data);
  }

  @MessagePattern('announcements.create')
  async createAnnouncement(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.announcementsService.create(tenantId, dto);
  }

  @MessagePattern('announcements.update')
  async updateAnnouncement(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.announcementsService.update(tenantId, id, dto);
  }
}
