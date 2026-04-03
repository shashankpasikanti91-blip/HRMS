import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { name: string; code: string; description?: string; headId?: string; parentId?: string }) {
    const existing = await this.prisma.department.findUnique({
      where: { tenantId_code: { tenantId, code: data.code } },
    });
    if (existing) throw new ConflictException('Department code already exists');

    return this.prisma.department.create({
      data: { tenantId, ...data },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { employees: true, children: true } },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { employees: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        head: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, code: true } },
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
          where: { status: 'active' },
          orderBy: { firstName: 'asc' },
        },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(tenantId: string, id: string, data: { name?: string; description?: string; headId?: string; parentId?: string }) {
    const existing = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Department not found');

    return this.prisma.department.update({
      where: { id },
      data,
      include: {
        head: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { employees: true } } },
    });
    if (!existing) throw new NotFoundException('Department not found');
    if (existing._count.employees > 0) {
      throw new ConflictException('Cannot delete department with employees');
    }

    await this.prisma.department.delete({ where: { id } });
    return { deleted: true };
  }

  async getTree(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });

    const map = new Map(departments.map((d) => [d.id, { ...d, children: [] as typeof departments }]));
    const roots: (typeof departments[0] & { children: typeof departments })[] = [];

    for (const dept of map.values()) {
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children.push(dept);
      } else {
        roots.push(dept);
      }
    }

    return roots;
  }
}
