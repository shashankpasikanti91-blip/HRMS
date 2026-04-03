import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { name: string; date: string; type?: string; isOptional?: boolean }) {
    return this.prisma.holiday.create({
      data: {
        tenantId,
        name: data.name,
        date: new Date(data.date),
        type: data.type || 'national',
        isOptional: data.isOptional || false,
      },
    });
  }

  async findAll(tenantId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    return this.prisma.holiday.findMany({
      where: {
        tenantId,
        date: {
          gte: new Date(targetYear, 0, 1),
          lte: new Date(targetYear, 11, 31),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.holiday.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Holiday not found');
    await this.prisma.holiday.delete({ where: { id } });
    return { deleted: true };
  }
}
