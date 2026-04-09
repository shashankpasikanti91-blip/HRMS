import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, userId: string, query?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, userId };
    if (query?.unreadOnly) {
      where.read = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, userId, read: false },
    });
    return { count };
  }

  async markRead(id: string) {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
    return notification;
  }

  async markAllRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async send(tenantId: string, data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    channel?: string;
    data?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        channel: data.channel || 'in_app',
        data: data.data || {},
      },
    });
  }

  async sendBulk(tenantId: string, userIds: string[], notification: {
    type: string;
    title: string;
    message: string;
    channel?: string;
    data?: any;
  }) {
    const records = userIds.map(userId => ({
      tenantId,
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channel: notification.channel || 'in_app',
      data: notification.data || {},
    }));

    return this.prisma.notification.createMany({ data: records });
  }

  async remove(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }
}
