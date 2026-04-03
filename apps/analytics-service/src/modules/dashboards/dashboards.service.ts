import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { DashboardQueryDto, DashboardPeriod } from './dto/dashboard-query.dto';
import { Decimal } from 'decimal.js';

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Executive Overview ─────────────────────────────────────

  async getExecutiveDashboard(tenantId: string, query: DashboardQueryDto) {
    const [headcount, departmentBreakdown, turnover, attendance, payroll, recruitment, performance] =
      await Promise.all([
        this.getHeadcountSummary(tenantId),
        this.getDepartmentBreakdown(tenantId),
        this.getTurnoverMetrics(tenantId, query),
        this.getAttendanceOverview(tenantId, query),
        this.getPayrollOverview(tenantId, query),
        this.getRecruitmentPipeline(tenantId),
        this.getPerformanceSnapshot(tenantId),
      ]);

    return {
      headcount,
      departmentBreakdown,
      turnover,
      attendance,
      payroll,
      recruitment,
      performance,
      generatedAt: new Date(),
    };
  }

  // ── Headcount ──────────────────────────────────────────────

  async getHeadcountSummary(tenantId: string) {
    const [total, active, onLeave, probation, byType, byGender, recentJoins, recentExits] =
      await Promise.all([
        this.prisma.employee.count({ where: { tenantId } }),
        this.prisma.employee.count({ where: { tenantId, status: 'active' } }),
        this.prisma.employee.count({ where: { tenantId, status: 'on_leave' } }),
        this.prisma.employee.count({ where: { tenantId, status: 'probation' } }),
        this.prisma.employee.groupBy({
          by: ['employmentType'],
          where: { tenantId, status: { in: ['active', 'probation'] } },
          _count: true,
        }),
        this.prisma.employee.groupBy({
          by: ['gender'],
          where: { tenantId, status: { in: ['active', 'probation'] } },
          _count: true,
        }),
        this.prisma.employee.count({
          where: {
            tenantId,
            dateOfJoining: { gte: this.getDateRange('month').start },
          },
        }),
        this.prisma.employee.count({
          where: {
            tenantId,
            dateOfSeparation: { gte: this.getDateRange('month').start },
          },
        }),
      ]);

    return {
      total,
      active,
      onLeave,
      probation,
      inactive: total - active - onLeave - probation,
      byType: byType.map((t) => ({ type: t.employmentType, count: t._count })),
      byGender: byGender.map((g) => ({ gender: g.gender, count: g._count })),
      newJoinsThisMonth: recentJoins,
      exitsThisMonth: recentExits,
      netChange: recentJoins - recentExits,
    };
  }

  async getHeadcountTrend(tenantId: string, months = 12) {
    const trends: { month: string; total: number; joins: number; exits: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const [joins, exits, totalAtEnd] = await Promise.all([
        this.prisma.employee.count({
          where: { tenantId, dateOfJoining: { gte: start, lte: end } },
        }),
        this.prisma.employee.count({
          where: { tenantId, dateOfSeparation: { gte: start, lte: end } },
        }),
        this.prisma.employee.count({
          where: { tenantId, dateOfJoining: { lte: end }, OR: [{ dateOfSeparation: null }, { dateOfSeparation: { gt: end } }] },
        }),
      ]);

      trends.push({ month: monthStr, total: totalAtEnd, joins, exits });
    }

    return trends;
  }

  // ── Department Breakdown ───────────────────────────────────

  async getDepartmentBreakdown(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });

    const total = departments.reduce((sum, d) => sum + d._count.employees, 0);

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      employeeCount: d._count.employees,
      percentage: total > 0 ? new Decimal(d._count.employees).div(total).mul(100).toDecimalPlaces(1).toNumber() : 0,
    }));
  }

  // ── Turnover Metrics ───────────────────────────────────────

  async getTurnoverMetrics(tenantId: string, query: DashboardQueryDto) {
    const range = this.getDateRange(query.period || 'year');

    const [totalEmployees, separations, voluntarySeparations] = await Promise.all([
      this.prisma.employee.count({
        where: { tenantId, dateOfJoining: { lte: range.end } },
      }),
      this.prisma.employee.count({
        where: { tenantId, dateOfSeparation: { gte: range.start, lte: range.end } },
      }),
      this.prisma.employee.count({
        where: {
          tenantId,
          dateOfSeparation: { gte: range.start, lte: range.end },
          separationReason: { in: ['resignation', 'voluntary'] },
        },
      }),
    ]);

    const avgEmployees = totalEmployees > 0 ? totalEmployees : 1;
    const turnoverRate = new Decimal(separations).div(avgEmployees).mul(100).toDecimalPlaces(2).toNumber();
    const voluntaryTurnoverRate = new Decimal(voluntarySeparations).div(avgEmployees).mul(100).toDecimalPlaces(2).toNumber();

    return {
      totalSeparations: separations,
      voluntarySeparations,
      involuntarySeparations: separations - voluntarySeparations,
      turnoverRate,
      voluntaryTurnoverRate,
      period: query.period || 'year',
    };
  }

  // ── Attendance Overview ────────────────────────────────────

  async getAttendanceOverview(tenantId: string, query: DashboardQueryDto) {
    const range = this.getDateRange(query.period || 'month');

    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        tenantId,
        date: { gte: range.start, lte: range.end },
        ...(query.departmentId && { employee: { departmentId: query.departmentId } }),
      },
      _count: true,
    });

    const total = records.reduce((sum, r) => sum + r._count, 0);
    const present = records.find((r) => r.status === 'present')?._count || 0;
    const absent = records.find((r) => r.status === 'absent')?._count || 0;
    const late = records.find((r) => r.status === 'late')?._count || 0;
    const halfDay = records.find((r) => r.status === 'half_day')?._count || 0;

    const avgHours = await this.prisma.attendanceRecord.aggregate({
      where: {
        tenantId,
        date: { gte: range.start, lte: range.end },
        totalHours: { not: null },
      },
      _avg: { totalHours: true },
    });

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      attendanceRate: total > 0 ? new Decimal(present + halfDay).div(total).mul(100).toDecimalPlaces(1).toNumber() : 0,
      avgWorkingHours: avgHours._avg.totalHours ? Number(new Decimal(avgHours._avg.totalHours).toDecimalPlaces(1)) : 0,
    };
  }

  async getAttendanceTrend(tenantId: string, days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['date', 'status'],
      where: { tenantId, date: { gte: start } },
      _count: true,
      orderBy: { date: 'asc' },
    });

    const grouped: Record<string, { present: number; absent: number; late: number }> = {};
    for (const r of records) {
      const dateStr = r.date.toISOString().slice(0, 10);
      if (!grouped[dateStr]) grouped[dateStr] = { present: 0, absent: 0, late: 0 };
      if (r.status === 'present') grouped[dateStr].present = r._count;
      if (r.status === 'absent') grouped[dateStr].absent = r._count;
      if (r.status === 'late') grouped[dateStr].late = r._count;
    }

    return Object.entries(grouped).map(([date, counts]) => ({ date, ...counts }));
  }

  // ── Payroll Overview ───────────────────────────────────────

  async getPayrollOverview(tenantId: string, query: DashboardQueryDto) {
    const range = this.getDateRange(query.period || 'month');

    const runs = await this.prisma.payrollRun.findMany({
      where: { tenantId, createdAt: { gte: range.start, lte: range.end } },
      orderBy: { createdAt: 'desc' },
    });

    const latestRun = runs[0] || null;
    const totalGross = runs.reduce((sum, r) => new Decimal(sum).plus(r.totalGross || 0).toNumber(), 0);
    const totalNet = runs.reduce((sum, r) => new Decimal(sum).plus(r.totalNet || 0).toNumber(), 0);
    const totalDeductions = runs.reduce((sum, r) => new Decimal(sum).plus(r.totalDeductions || 0).toNumber(), 0);

    return {
      totalRuns: runs.length,
      totalGross,
      totalNet,
      totalDeductions,
      latestRun: latestRun
        ? { id: latestRun.id, period: latestRun.period, status: latestRun.status, totalEmployees: latestRun.totalEmployees, totalNet: latestRun.totalNet }
        : null,
    };
  }

  async getPayrollTrend(tenantId: string, months = 12) {
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    const runs = await this.prisma.payrollRun.findMany({
      where: { tenantId, createdAt: { gte: start } },
      orderBy: { createdAt: 'asc' },
      select: { period: true, totalGross: true, totalNet: true, totalDeductions: true, totalEmployees: true },
    });

    return runs.map((r) => ({
      period: r.period,
      totalGross: Number(r.totalGross || 0),
      totalNet: Number(r.totalNet || 0),
      totalDeductions: Number(r.totalDeductions || 0),
      totalEmployees: r.totalEmployees,
    }));
  }

  // ── Recruitment Pipeline ───────────────────────────────────

  async getRecruitmentPipeline(tenantId: string) {
    const [openJobs, totalCandidates, stageBreakdown, sourceBreakdown] = await Promise.all([
      this.prisma.jobPosting.count({ where: { tenantId, status: 'published' } }),
      this.prisma.candidate.count({ where: { tenantId } }),
      this.prisma.candidate.groupBy({
        by: ['stage'],
        where: { tenantId, status: { not: 'rejected' } },
        _count: true,
      }),
      this.prisma.candidate.groupBy({
        by: ['source'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const upcomingInterviews = await this.prisma.interview.count({
      where: {
        tenantId,
        scheduledAt: { gte: new Date() },
        status: 'scheduled',
      },
    });

    return {
      openPositions: openJobs,
      totalCandidates,
      upcomingInterviews,
      pipeline: stageBreakdown.map((s) => ({ stage: s.stage, count: s._count })),
      sources: sourceBreakdown.map((s) => ({ source: s.source, count: s._count })),
    };
  }

  // ── Performance Snapshot ───────────────────────────────────

  async getPerformanceSnapshot(tenantId: string) {
    const activeCycle = await this.prisma.reviewCycle.findFirst({
      where: { tenantId, status: 'active' },
      orderBy: { startDate: 'desc' },
    });

    if (!activeCycle) {
      return { activeCycle: null, totalReviews: 0, completedReviews: 0, pendingReviews: 0, avgRating: 0, ratingDistribution: [] };
    }

    const [totalReviews, completedReviews, ratingAgg, ratingDist] = await Promise.all([
      this.prisma.performanceReview.count({ where: { tenantId, reviewCycleId: activeCycle.id } }),
      this.prisma.performanceReview.count({ where: { tenantId, reviewCycleId: activeCycle.id, status: 'completed' } }),
      this.prisma.performanceReview.aggregate({
        where: { tenantId, reviewCycleId: activeCycle.id, status: 'completed', overallRating: { not: null } },
        _avg: { overallRating: true },
      }),
      this.prisma.performanceReview.groupBy({
        by: ['overallRating'],
        where: { tenantId, reviewCycleId: activeCycle.id, status: 'completed' },
        _count: true,
      }),
    ]);

    return {
      activeCycle: { id: activeCycle.id, name: activeCycle.name, status: activeCycle.status },
      totalReviews,
      completedReviews,
      pendingReviews: totalReviews - completedReviews,
      completionRate: totalReviews > 0 ? new Decimal(completedReviews).div(totalReviews).mul(100).toDecimalPlaces(1).toNumber() : 0,
      avgRating: ratingAgg._avg.overallRating ? Number(new Decimal(ratingAgg._avg.overallRating).toDecimalPlaces(2)) : 0,
      ratingDistribution: ratingDist.map((r) => ({ rating: r.overallRating, count: r._count })),
    };
  }

  // ── Leave Analytics ────────────────────────────────────────

  async getLeaveAnalytics(tenantId: string, query: DashboardQueryDto) {
    const range = this.getDateRange(query.period || 'month');

    const [statusBreakdown, typeBreakdown, avgDuration] = await Promise.all([
      this.prisma.leaveRequest.groupBy({
        by: ['status'],
        where: { tenantId, createdAt: { gte: range.start, lte: range.end } },
        _count: true,
      }),
      this.prisma.leaveRequest.groupBy({
        by: ['leaveTypeId'],
        where: { tenantId, createdAt: { gte: range.start, lte: range.end } },
        _count: true,
        _sum: { totalDays: true },
      }),
      this.prisma.leaveRequest.aggregate({
        where: { tenantId, createdAt: { gte: range.start, lte: range.end }, status: 'approved' },
        _avg: { totalDays: true },
      }),
    ]);

    const leaveTypes = await this.prisma.leaveType.findMany({ where: { tenantId }, select: { id: true, name: true } });
    const typeMap = new Map(leaveTypes.map((lt) => [lt.id, lt.name]));

    return {
      byStatus: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
      byType: typeBreakdown.map((t) => ({
        typeId: t.leaveTypeId,
        typeName: typeMap.get(t.leaveTypeId) || 'Unknown',
        count: t._count,
        totalDays: Number(t._sum.totalDays || 0),
      })),
      avgLeaveDuration: avgDuration._avg.totalDays ? Number(new Decimal(avgDuration._avg.totalDays).toDecimalPlaces(1)) : 0,
    };
  }

  // ── Helpers ────────────────────────────────────────────────

  private getDateRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  }
}
