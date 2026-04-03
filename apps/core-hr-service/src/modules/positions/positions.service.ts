import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { title: string; code: string; description?: string; departmentId?: string; level?: number; minSalary?: number; maxSalary?: number }) {
    const existing = await this.prisma.position.findUnique({
      where: { tenantId_code: { tenantId, code: data.code } },
    });
    if (existing) throw new ConflictException('Position code already exists');

    return this.prisma.position.create({
      data: { tenantId, ...data },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  async findAll(tenantId: string, departmentId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (departmentId) where.departmentId = departmentId;

    return this.prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const position = await this.prisma.position.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
          where: { status: 'active' },
        },
      },
    });
    if (!position) throw new NotFoundException('Position not found');
    return position;
  }

  async update(tenantId: string, id: string, data: { title?: string; description?: string; departmentId?: string; level?: number; minSalary?: number; maxSalary?: number }) {
    const existing = await this.prisma.position.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Position not found');

    return this.prisma.position.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.position.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { employees: true } } },
    });
    if (!existing) throw new NotFoundException('Position not found');
    if (existing._count.employees > 0) {
      throw new ConflictException('Cannot delete position with employees');
    }
    await this.prisma.position.delete({ where: { id } });
    return { deleted: true };
  }
}
