import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class CyclesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    goalSettingDeadline?: string;
    selfReviewDeadline?: string;
    managerReviewDeadline?: string;
    type?: string;
  }) {
    return this.prisma.reviewCycle.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        goalSettingDeadline: data.goalSettingDeadline ? new Date(data.goalSettingDeadline) : undefined,
        selfReviewDeadline: data.selfReviewDeadline ? new Date(data.selfReviewDeadline) : undefined,
        managerReviewDeadline: data.managerReviewDeadline ? new Date(data.managerReviewDeadline) : undefined,
        type: data.type || 'annual',
        status: 'draft',
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.reviewCycle.findMany({
      where: { tenantId },
      include: {
        _count: { select: { goals: true, reviews: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { goals: true, reviews: true } },
      },
    });
    if (!cycle) throw new NotFoundException('Review cycle not found');
    return cycle;
  }

  async activate(tenantId: string, id: string) {
    const cycle = await this.prisma.reviewCycle.findFirst({ where: { id, tenantId } });
    if (!cycle) throw new NotFoundException('Review cycle not found');
    return this.prisma.reviewCycle.update({ where: { id }, data: { status: 'active' } });
  }

  async complete(tenantId: string, id: string) {
    const cycle = await this.prisma.reviewCycle.findFirst({ where: { id, tenantId } });
    if (!cycle) throw new NotFoundException('Review cycle not found');
    return this.prisma.reviewCycle.update({ where: { id }, data: { status: 'completed' } });
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    const cycle = await this.prisma.reviewCycle.findFirst({ where: { id, tenantId } });
    if (!cycle) throw new NotFoundException('Review cycle not found');
    return this.prisma.reviewCycle.update({ where: { id }, data });
  }
}
