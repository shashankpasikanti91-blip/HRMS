// ============================================================
// SRP AI HRMS - Leave Management Service
// ============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  // Apply for leave
  async applyLeave(tenantId: string, data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
    isHalfDay?: boolean;
  }) {
    // Check balance
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year: new Date().getFullYear(),
        },
      },
    });

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = data.isHalfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (balance && (balance.balance - balance.used) < days) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${balance.balance - balance.used}, Requested: ${days}`,
      );
    }

    // Check for overlapping leaves
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId: data.employeeId,
        status: { in: ['pending', 'approved'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlap) {
      throw new BadRequestException('You have an overlapping leave request');
    }

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays: days,
        reason: data.reason,
        isHalfDay: data.isHalfDay || false,
        status: 'pending',
      },
      include: {
        leaveType: { select: { name: true, color: true } },
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  // Approve/Reject leave
  async updateLeaveStatus(tenantId: string, id: string, status: 'approved' | 'rejected', approverId: string, comments?: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    if (!leave) throw new NotFoundException('Leave request not found or already processed');

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedById: approverId,
        approverComments: comments,
        approvedAt: new Date(),
      },
      include: {
        leaveType: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    // Update balance if approved
    if (status === 'approved') {
      await this.prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leave.employeeId,
            leaveTypeId: leave.leaveTypeId,
            year: new Date().getFullYear(),
          },
        },
        data: { used: { increment: leave.totalDays } },
      });
    }

    return updated;
  }

  // Cancel leave
  async cancelLeave(tenantId: string, id: string, employeeId: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, tenantId, employeeId },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status === 'cancelled') throw new BadRequestException('Already cancelled');

    // If was approved, restore balance
    if (leave.status === 'approved') {
      await this.prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leave.employeeId,
            leaveTypeId: leave.leaveTypeId,
            year: new Date().getFullYear(),
          },
        },
        data: { used: { decrement: leave.totalDays } },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  // Get employee leaves
  async getEmployeeLeaves(tenantId: string, employeeId: string, year?: number) {
    const where: Record<string, unknown> = { tenantId, employeeId };
    if (year) {
      where.startDate = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: { select: { name: true, color: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get pending approvals (for managers)
  async getPendingApprovals(tenantId: string, managerId: string) {
    const directReports = await this.prisma.employee.findMany({
      where: { tenantId, managerId },
      select: { id: true },
    });

    const employeeIds = directReports.map((e) => e.id);

    return this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        status: 'pending',
      },
      include: {
        leaveType: { select: { name: true, color: true } },
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Get leave balances
  async getLeaveBalances(tenantId: string, employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
      include: {
        leaveType: { select: { name: true, color: true, maxDays: true } },
      },
    });
  }

  // Get leave types for tenant
  async getLeaveTypes(tenantId: string) {
    return this.prisma.leaveType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // Create or update leave type
  async upsertLeaveType(tenantId: string, data: {
    id?: string;
    name: string;
    code: string;
    maxDays: number;
    carryForward?: boolean;
    maxCarryForward?: number;
    color?: string;
  }) {
    if (data.id) {
      return this.prisma.leaveType.update({
        where: { id: data.id },
        data: {
          name: data.name,
          maxDays: data.maxDays,
          carryForward: data.carryForward,
          maxCarryForward: data.maxCarryForward,
          color: data.color,
        },
      });
    }

    return this.prisma.leaveType.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        maxDays: data.maxDays,
        carryForward: data.carryForward ?? false,
        maxCarryForward: data.maxCarryForward ?? 0,
        color: data.color,
      },
    });
  }

  // Initialize leave balances for a year
  async initializeBalances(tenantId: string, year: number) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active' },
      select: { id: true },
    });

    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { tenantId, isActive: true },
    });

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        await this.prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: emp.id,
              leaveTypeId: lt.id,
              year,
            },
          },
          create: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year,
            balance: lt.maxDays,
            used: 0,
          },
          update: {},
        });
      }
    }

    return { initialized: employees.length * leaveTypes.length };
  }
}
