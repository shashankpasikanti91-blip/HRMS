import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async createSkill(tenantId: string, data: { name: string; category?: string; description?: string }) {
    return this.prisma.skill.create({ data: { tenantId, ...data } });
  }

  async findAllSkills(tenantId: string, category?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (category) where.category = category;
    return this.prisma.skill.findMany({ where, orderBy: { name: 'asc' } });
  }

  async assignSkill(tenantId: string, employeeId: string, skillId: string, level: number) {
    return this.prisma.employeeSkill.upsert({
      where: { employeeId_skillId: { employeeId, skillId } },
      create: { employeeId, skillId, level, verifiedAt: null },
      update: { level },
    });
  }

  async getEmployeeSkills(tenantId: string, employeeId: string) {
    return this.prisma.employeeSkill.findMany({
      where: { employee: { tenantId }, employeeId },
      include: { skill: true },
      orderBy: { level: 'desc' },
    });
  }

  async getSkillMatrix(tenantId: string, departmentId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (departmentId) where.departmentId = departmentId;

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true,
        skills: { include: { skill: true } },
      },
    });
    return employees;
  }

  async getSkillGap(tenantId: string, positionId: string) {
    const position = await this.prisma.position.findFirst({ where: { id: positionId, tenantId } });
    if (!position) throw new NotFoundException('Position not found');

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, positionId },
      select: {
        id: true, firstName: true, lastName: true,
        skills: { include: { skill: true } },
      },
    });

    return { position, employees };
  }
}
