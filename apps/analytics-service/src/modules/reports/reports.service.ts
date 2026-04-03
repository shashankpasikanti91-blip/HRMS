import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { GenerateReportDto, ReportType, ReportFormat } from './dto/generate-report.dto';
import { Decimal } from 'decimal.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(dto: GenerateReportDto) {
    const { start, end } = this.parseDateRange(dto.startDate, dto.endDate);

    let data: unknown;
    switch (dto.type) {
      case ReportType.HEADCOUNT:
        data = await this.headcountReport(dto.tenantId, start, end, dto.departmentId);
        break;
      case ReportType.TURNOVER:
        data = await this.turnoverReport(dto.tenantId, start, end);
        break;
      case ReportType.ATTENDANCE:
        data = await this.attendanceReport(dto.tenantId, start, end, dto.departmentId);
        break;
      case ReportType.PAYROLL:
        data = await this.payrollReport(dto.tenantId, start, end);
        break;
      case ReportType.LEAVE:
        data = await this.leaveReport(dto.tenantId, start, end, dto.departmentId);
        break;
      case ReportType.RECRUITMENT:
        data = await this.recruitmentReport(dto.tenantId, start, end);
        break;
      case ReportType.PERFORMANCE:
        data = await this.performanceReport(dto.tenantId);
        break;
      case ReportType.COMPENSATION:
        data = await this.compensationReport(dto.tenantId, dto.departmentId);
        break;
      case ReportType.DIVERSITY:
        data = await this.diversityReport(dto.tenantId);
        break;
      default:
        throw new BadRequestException(`Report type ${dto.type} is not supported`);
    }

    const report = {
      type: dto.type,
      format: dto.format,
      tenantId: dto.tenantId,
      generatedAt: new Date(),
      period: { startDate: start, endDate: end },
      data,
    };

    if (dto.format === ReportFormat.CSV) {
      return { ...report, csv: this.convertToCSV(data) };
    }

    return report;
  }

  // ── Headcount Report ───────────────────────────────────────

  private async headcountReport(tenantId: string, start: Date, end: Date, departmentId?: string) {
    const where: Record<string, unknown> = { tenantId, status: { in: ['active', 'probation', 'on_leave'] } };
    if (departmentId) where.departmentId = departmentId;

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        employmentType: true,
        dateOfJoining: true,
        status: true,
        department: { select: { name: true, code: true } },
        position: { select: { title: true, grade: true } },
      },
      orderBy: { dateOfJoining: 'desc' },
    });

    const summary = {
      totalCount: employees.length,
      byGender: this.groupCount(employees, 'gender'),
      byEmploymentType: this.groupCount(employees, 'employmentType'),
      byStatus: this.groupCount(employees, 'status'),
      newJoins: employees.filter((e) => e.dateOfJoining >= start && e.dateOfJoining <= end).length,
    };

    return { summary, employees };
  }

  // ── Turnover Report ────────────────────────────────────────

  private async turnoverReport(tenantId: string, start: Date, end: Date) {
    const separatedEmployees = await this.prisma.employee.findMany({
      where: { tenantId, dateOfSeparation: { gte: start, lte: end } },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
        dateOfSeparation: true,
        separationReason: true,
        department: { select: { name: true } },
        position: { select: { title: true } },
      },
      orderBy: { dateOfSeparation: 'desc' },
    });

    const totalAtStart = await this.prisma.employee.count({
      where: { tenantId, dateOfJoining: { lte: start }, OR: [{ dateOfSeparation: null }, { dateOfSeparation: { gt: start } }] },
    });

    const totalAtEnd = await this.prisma.employee.count({
      where: { tenantId, dateOfJoining: { lte: end }, OR: [{ dateOfSeparation: null }, { dateOfSeparation: { gt: end } }] },
    });

    const avgHeadcount = (totalAtStart + totalAtEnd) / 2 || 1;
    const turnoverRate = new Decimal(separatedEmployees.length).div(avgHeadcount).mul(100).toDecimalPlaces(2).toNumber();

    const byReason = this.groupCount(separatedEmployees, 'separationReason');
    const byDepartment = separatedEmployees.reduce<Record<string, number>>((acc, e) => {
      const dept = e.department?.name || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const avgTenure = separatedEmployees
      .filter((e) => e.dateOfSeparation && e.dateOfJoining)
      .reduce((sum, e) => {
        const tenure = (e.dateOfSeparation!.getTime() - e.dateOfJoining.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return sum + tenure;
      }, 0);

    return {
      summary: {
        totalSeparations: separatedEmployees.length,
        turnoverRate,
        avgTenureYears: separatedEmployees.length > 0 ? Number(new Decimal(avgTenure).div(separatedEmployees.length).toDecimalPlaces(1)) : 0,
        headcountStart: totalAtStart,
        headcountEnd: totalAtEnd,
        byReason,
        byDepartment,
      },
      employees: separatedEmployees,
    };
  }

  // ── Attendance Report ──────────────────────────────────────

  private async attendanceReport(tenantId: string, start: Date, end: Date, departmentId?: string) {
    const where: Record<string, unknown> = { tenantId, date: { gte: start, lte: end } };
    if (departmentId) where.employee = { departmentId };

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      select: {
        id: true,
        date: true,
        clockIn: true,
        clockOut: true,
        totalHours: true,
        overtimeHours: true,
        status: true,
        source: true,
        employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    const statusCounts = this.groupCount(records, 'status');
    const totalHours = records.reduce((sum, r) => sum + Number(r.totalHours || 0), 0);
    const totalOvertimeHours = records.reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0);

    return {
      summary: {
        totalRecords: records.length,
        ...statusCounts,
        totalHours: Number(new Decimal(totalHours).toDecimalPlaces(1)),
        totalOvertimeHours: Number(new Decimal(totalOvertimeHours).toDecimalPlaces(1)),
        avgHoursPerDay: records.length > 0 ? Number(new Decimal(totalHours).div(records.length).toDecimalPlaces(1)) : 0,
      },
      records,
    };
  }

  // ── Payroll Report ─────────────────────────────────────────

  private async payrollReport(tenantId: string, start: Date, end: Date) {
    const payslips = await this.prisma.payslip.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      select: {
        id: true,
        period: true,
        grossPay: true,
        totalDeductions: true,
        netPay: true,
        status: true,
        employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
      },
      orderBy: { period: 'desc' },
    });

    const totalGross = payslips.reduce((s, p) => new Decimal(s).plus(p.grossPay || 0).toNumber(), 0);
    const totalDeductions = payslips.reduce((s, p) => new Decimal(s).plus(p.totalDeductions || 0).toNumber(), 0);
    const totalNet = payslips.reduce((s, p) => new Decimal(s).plus(p.netPay || 0).toNumber(), 0);

    const byDepartment = payslips.reduce<Record<string, { gross: number; net: number; count: number }>>((acc, p) => {
      const dept = p.employee?.department?.name || 'Unassigned';
      if (!acc[dept]) acc[dept] = { gross: 0, net: 0, count: 0 };
      acc[dept].gross = new Decimal(acc[dept].gross).plus(p.grossPay || 0).toNumber();
      acc[dept].net = new Decimal(acc[dept].net).plus(p.netPay || 0).toNumber();
      acc[dept].count++;
      return acc;
    }, {});

    return {
      summary: { totalPayslips: payslips.length, totalGross, totalDeductions, totalNet, byDepartment },
      payslips,
    };
  }

  // ── Leave Report ───────────────────────────────────────────

  private async leaveReport(tenantId: string, start: Date, end: Date, departmentId?: string) {
    const where: Record<string, unknown> = { tenantId, createdAt: { gte: start, lte: end } };
    if (departmentId) where.employee = { departmentId };

    const requests = await this.prisma.leaveRequest.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        reason: true,
        status: true,
        employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalDays = requests.filter((r) => r.status === 'approved').reduce((s, r) => s + (r.totalDays || 0), 0);

    return {
      summary: {
        totalRequests: requests.length,
        byStatus: this.groupCount(requests, 'status'),
        totalApprovedDays: totalDays,
        byType: requests.reduce<Record<string, number>>((acc, r) => {
          const type = r.leaveType?.name || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
      },
      requests,
    };
  }

  // ── Recruitment Report ─────────────────────────────────────

  private async recruitmentReport(tenantId: string, start: Date, end: Date) {
    const [jobs, candidates] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: {
          id: true,
          title: true,
          status: true,
          vacancies: true,
          location: true,
          createdAt: true,
          department: { select: { name: true } },
          _count: { select: { candidates: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidate.findMany({
        where: { tenantId, appliedAt: { gte: start, lte: end } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          source: true,
          stage: true,
          status: true,
          aiScore: true,
          appliedAt: true,
          job: { select: { title: true } },
        },
        orderBy: { appliedAt: 'desc' },
      }),
    ]);

    return {
      summary: {
        totalJobs: jobs.length,
        totalVacancies: jobs.reduce((s, j) => s + j.vacancies, 0),
        totalCandidates: candidates.length,
        byStage: this.groupCount(candidates, 'stage'),
        bySource: this.groupCount(candidates, 'source'),
        avgAiScore: candidates.length > 0
          ? Number(new Decimal(candidates.reduce((s, c) => s + (c.aiScore || 0), 0)).div(candidates.filter((c) => c.aiScore).length || 1).toDecimalPlaces(1))
          : 0,
      },
      jobs,
      candidates,
    };
  }

  // ── Performance Report ─────────────────────────────────────

  private async performanceReport(tenantId: string) {
    const latestCycle = await this.prisma.reviewCycle.findFirst({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });

    if (!latestCycle) return { summary: { message: 'No review cycles found' }, reviews: [] };

    const reviews = await this.prisma.performanceReview.findMany({
      where: { tenantId, reviewCycleId: latestCycle.id },
      select: {
        id: true,
        type: true,
        overallRating: true,
        status: true,
        submittedAt: true,
        employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
      },
      orderBy: { overallRating: 'desc' },
    });

    const completed = reviews.filter((r) => r.status === 'completed');
    const avgRating = completed.length > 0
      ? Number(new Decimal(completed.reduce((s, r) => s + (r.overallRating || 0), 0)).div(completed.length).toDecimalPlaces(2))
      : 0;

    return {
      summary: {
        cycleName: latestCycle.name,
        totalReviews: reviews.length,
        completedReviews: completed.length,
        completionRate: reviews.length > 0 ? Number(new Decimal(completed.length).div(reviews.length).mul(100).toDecimalPlaces(1)) : 0,
        avgRating,
        ratingDistribution: this.groupCount(completed, 'overallRating'),
      },
      reviews,
    };
  }

  // ── Compensation Report ────────────────────────────────────

  private async compensationReport(tenantId: string, departmentId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (departmentId) where.employeeId = { in: (await this.prisma.employee.findMany({ where: { tenantId, departmentId }, select: { id: true } })).map((e) => e.id) };

    const salaries = await this.prisma.salaryStructure.findMany({
      where: { tenantId },
      select: {
        id: true,
        basicSalary: true,
        hra: true,
        grossSalary: true,
        netSalary: true,
        effectiveDate: true,
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            gender: true,
            employmentType: true,
            department: { select: { name: true } },
            position: { select: { title: true, grade: true } },
          },
        },
      },
    });

    const grossValues = salaries.map((s) => Number(s.grossSalary || 0));
    const totalComp = grossValues.reduce((s, v) => new Decimal(s).plus(v).toNumber(), 0);
    const avgComp = grossValues.length > 0 ? Number(new Decimal(totalComp).div(grossValues.length).toDecimalPlaces(0)) : 0;
    const medianComp = this.median(grossValues);

    const byDepartment = salaries.reduce<Record<string, { total: number; count: number; avg: number }>>((acc, s) => {
      const dept = s.employee?.department?.name || 'Unassigned';
      if (!acc[dept]) acc[dept] = { total: 0, count: 0, avg: 0 };
      acc[dept].total = new Decimal(acc[dept].total).plus(Number(s.grossSalary || 0)).toNumber();
      acc[dept].count++;
      acc[dept].avg = Number(new Decimal(acc[dept].total).div(acc[dept].count).toDecimalPlaces(0));
      return acc;
    }, {});

    const byGender = salaries.reduce<Record<string, { total: number; count: number; avg: number }>>((acc, s) => {
      const gender = s.employee?.gender || 'unknown';
      if (!acc[gender]) acc[gender] = { total: 0, count: 0, avg: 0 };
      acc[gender].total = new Decimal(acc[gender].total).plus(Number(s.grossSalary || 0)).toNumber();
      acc[gender].count++;
      acc[gender].avg = Number(new Decimal(acc[gender].total).div(acc[gender].count).toDecimalPlaces(0));
      return acc;
    }, {});

    return {
      summary: { totalEmployees: salaries.length, totalCompensation: totalComp, averageCompensation: avgComp, medianCompensation: medianComp, byDepartment, byGender },
      salaries,
    };
  }

  // ── Diversity Report ───────────────────────────────────────

  private async diversityReport(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: { in: ['active', 'probation'] } },
      select: {
        id: true,
        gender: true,
        nationality: true,
        employmentType: true,
        dateOfBirth: true,
        department: { select: { name: true } },
        position: { select: { title: true, grade: true } },
      },
    });

    const ageGroups = employees.reduce<Record<string, number>>((acc, e) => {
      if (!e.dateOfBirth) { acc['Unknown'] = (acc['Unknown'] || 0) + 1; return acc; }
      const age = Math.floor((Date.now() - e.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const group = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : age < 55 ? '45-54' : '55+';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    const genderByDept = employees.reduce<Record<string, Record<string, number>>>((acc, e) => {
      const dept = e.department?.name || 'Unassigned';
      const gender = e.gender || 'unknown';
      if (!acc[dept]) acc[dept] = {};
      acc[dept][gender] = (acc[dept][gender] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEmployees: employees.length,
      gender: this.groupCount(employees, 'gender'),
      nationality: this.groupCount(employees, 'nationality'),
      ageGroups,
      employmentType: this.groupCount(employees, 'employmentType'),
      genderByDepartment: genderByDept,
    };
  }

  // ── Helpers ────────────────────────────────────────────────

  private parseDateRange(startDate?: string, endDate?: string) {
    const now = new Date();
    return {
      start: startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1),
      end: endDate ? new Date(endDate) : now,
    };
  }

  private groupCount(items: Record<string, unknown>[], field: string): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = String(item[field] ?? 'unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private convertToCSV(data: unknown): string {
    if (!data || typeof data !== 'object') return '';
    const obj = data as Record<string, unknown>;

    const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
    if (!arrayKey) return JSON.stringify(data);

    const rows = obj[arrayKey] as Record<string, unknown>[];
    if (rows.length === 0) return '';

    const flatRows = rows.map((row) => this.flattenObject(row));
    const headers = [...new Set(flatRows.flatMap((r) => Object.keys(r)))];
    const csvHeader = headers.join(',');
    const csvRows = flatRows.map((row) => headers.map((h) => this.escapeCsvValue(row[h])).join(','));

    return [csvHeader, ...csvRows].join('\n');
  }

  private flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, this.flattenObject(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
