// ============================================================
// SRP AI HRMS - Attendance Service
// ============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Clock In
  async clockIn(tenantId: string, employeeId: string, data?: {
    clockInLocation?: any;
    clockInPhoto?: string;
    source?: string;
  }) {
    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        tenantId,
        employeeId,
        date: { gte: today, lt: tomorrow },
        clockOut: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Already clocked in. Please clock out first.');
    }

    return this.prisma.attendanceRecord.create({
      data: {
        tenantId,
        employeeId,
        date: today,
        clockIn: new Date(),
        clockInLocation: data?.clockInLocation,
        clockInPhoto: data?.clockInPhoto,
        source: data?.source || 'web',
        status: 'present',
      },
    });
  }

  // Clock Out
  async clockOut(tenantId: string, employeeId: string, data?: {
    clockOutLocation?: any;
    clockOutPhoto?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        tenantId,
        employeeId,
        date: { gte: today, lt: tomorrow },
        clockOut: null,
      },
    });

    if (!record) {
      throw new BadRequestException('No active clock-in found for today');
    }

    const clockOut = new Date();
    const totalHours = (clockOut.getTime() - record.clockIn.getTime()) / (1000 * 60 * 60);
    const overtimeHours = Math.max(0, totalHours - 8);

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        clockOut,
        clockOutLocation: data?.clockOutLocation,
        clockOutPhoto: data?.clockOutPhoto,
        totalHours: Math.round(totalHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
      },
    });
  }

  // Get today's status
  async getTodayStatus(tenantId: string, employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await this.prisma.attendanceRecord.findFirst({
      where: { tenantId, employeeId, date: { gte: today, lt: tomorrow } },
    });

    return {
      isClockedIn: record && !record.clockOut,
      record,
    };
  }

  // Get employee attendance history
  async getEmployeeAttendance(tenantId: string, employeeId: string, startDate: string, endDate: string) {
    return this.prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        employeeId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Get team attendance (for managers)
  async getTeamAttendance(tenantId: string, date: string, departmentId?: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: Record<string, unknown> = {
      tenantId,
      date: { gte: targetDate, lt: nextDay },
    };

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            departmentId: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    // Filter by department if needed
    if (departmentId) {
      return records.filter((r) => r.employee.departmentId === departmentId);
    }

    return records;
  }

  // Monthly summary
  async getMonthlySummary(tenantId: string, employeeId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalDays = endDate.getDate();
    const presentDays = records.filter((r) => r.status === 'present').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const lateDays = records.filter((r) => r.status === 'late').length;
    const halfDays = records.filter((r) => r.status === 'half-day').length;
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const overtimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return {
      year,
      month,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      totalHours: Math.round(totalHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      averageHoursPerDay: presentDays ? Math.round((totalHours / presentDays) * 100) / 100 : 0,
    };
  }

  // Bulk mark attendance (admin)
  async bulkMarkAttendance(tenantId: string, entries: {
    employeeId: string;
    date: string;
    status: string;
    totalHours?: number;
    notes?: string;
  }[]) {
    const results = [];
    for (const entry of entries) {
      const record = await this.prisma.attendanceRecord.upsert({
        where: {
          tenantId_employeeId_date: {
            tenantId,
            employeeId: entry.employeeId,
            date: new Date(entry.date),
          },
        },
        create: {
          tenantId,
          employeeId: entry.employeeId,
          date: new Date(entry.date),
          clockIn: new Date(entry.date + 'T09:00:00'),
          status: entry.status,
          totalHours: entry.totalHours,
          notes: entry.notes,
          source: 'manual',
        },
        update: {
          status: entry.status,
          totalHours: entry.totalHours,
          notes: entry.notes,
        },
      });
      results.push(record);
    }
    return results;
  }
}
