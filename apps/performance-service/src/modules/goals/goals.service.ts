import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    employeeId: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    startDate?: string;
    dueDate: string;
    weight?: number;
    targetValue?: number;
    unit?: string;
    alignedGoalId?: string;
    reviewCycleId?: string;
  }) {
    return this.prisma.goal.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        category: data.category || 'individual',
        priority: data.priority || 'medium',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        dueDate: new Date(data.dueDate),
        weight: data.weight || 1,
        targetValue: data.targetValue,
        unit: data.unit,
        alignedGoalId: data.alignedGoalId,
        reviewCycleId: data.reviewCycleId,
        status: 'not_started',
        progress: 0,
      },
    });
  }

  async findAll(tenantId: string, employeeId?: string, status?: string, cycleId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (cycleId) where.reviewCycleId = cycleId;

    return this.prisma.goal.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        alignedGoal: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, tenantId },
      include: {
        employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        alignedGoal: { select: { id: true, title: true } },
        childGoals: { select: { id: true, title: true, status: true, progress: true } },
      },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async updateProgress(tenantId: string, id: string, progress: number, currentValue?: number) {
    const goal = await this.prisma.goal.findFirst({ where: { id, tenantId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

    return this.prisma.goal.update({
      where: { id },
      data: {
        progress: Math.min(progress, 100),
        currentValue,
        status,
        ...(progress >= 100 && { completedAt: new Date() }),
      },
    });
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    const goal = await this.prisma.goal.findFirst({ where: { id, tenantId } });
    if (!goal) throw new NotFoundException('Goal not found');
    return this.prisma.goal.update({ where: { id }, data });
  }

  async getTeamGoals(tenantId: string, managerId: string) {
    const directReports = await this.prisma.employee.findMany({
      where: { tenantId, reportingManagerId: managerId },
      select: { id: true },
    });
    const employeeIds = directReports.map((e) => e.id);

    return this.prisma.goal.findMany({
      where: { tenantId, employeeId: { in: employeeIds } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getGoalStats(tenantId: string, employeeId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;

    const goals = await this.prisma.goal.findMany({ where, select: { status: true, progress: true } });
    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const inProgress = goals.filter((g) => g.status === 'in_progress').length;
    const avgProgress = total > 0 ? goals.reduce((s, g) => s + g.progress, 0) / total : 0;

    return { total, completed, inProgress, notStarted: total - completed - inProgress, avgProgress: Math.round(avgProgress) };
  }
}
