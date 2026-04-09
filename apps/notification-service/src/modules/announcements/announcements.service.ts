import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query?: { status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (query?.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.announcement.findFirst({
      where: { id, tenantId },
    });
  }

  async create(tenantId: string, data: {
    title: string;
    content: string;
    type?: string;
    priority?: string;
    targetRoles?: string[];
    targetDepts?: string[];
    authorId: string;
    publishedAt?: string;
    expiresAt?: string;
  }) {
    return this.prisma.announcement.create({
      data: {
        tenantId,
        title: data.title,
        content: data.content,
        type: data.type || 'general',
        priority: data.priority || 'normal',
        targetRoles: data.targetRoles || [],
        targetDepts: data.targetDepts || [],
        authorId: data.authorId,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: 'published',
      },
    });
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    return this.prisma.announcement.update({
      where: { id },
      data: data as any,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.prisma.announcement.delete({ where: { id } });
    return { deleted: true };
  }
}
