import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { WorkforceQueryDto } from './dto/workforce-query.dto';
import { Decimal } from 'decimal.js';

@Injectable()
export class WorkforceAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Attrition Risk Analysis ────────────────────────────────

  async getAttritionRiskAnalysis(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: { in: ['active', 'probation'] } },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
        dateOfConfirmation: true,
        employmentType: true,
        status: true,
        department: { select: { name: true } },
        position: { select: { title: true, grade: true } },
        salaryStructure: { select: { grossSalary: true }, orderBy: { effectiveDate: 'desc' }, take: 1 },
        performanceReviews: { select: { overallRating: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        leaveRequests: { where: { status: 'approved' }, select: { totalDays: true } },
      },
    });

    const riskScores = employees.map((emp) => {
      let riskScore = 0;
      const factors: string[] = [];

      // Tenure factor: employees 1-2 years have higher attrition risk
      const tenureYears = (Date.now() - emp.dateOfJoining.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (tenureYears < 1) { riskScore += 15; factors.push('Short tenure (<1 year)'); }
      else if (tenureYears < 2) { riskScore += 20; factors.push('Critical tenure window (1-2 years)'); }
      else if (tenureYears > 7) { riskScore += 10; factors.push('Long tenure (>7 years, possible stagnation)'); }

      // Performance factor
      const lastRating = emp.performanceReviews?.[0]?.overallRating;
      if (lastRating !== null && lastRating !== undefined) {
        if (lastRating <= 2) { riskScore += 25; factors.push('Low performance rating'); }
        else if (lastRating >= 4) { riskScore += 10; factors.push('High performer (may seek external growth)'); }
      } else {
        riskScore += 5; factors.push('No performance review on record');
      }

      // Leave pattern factor
      const totalLeaveDays = emp.leaveRequests?.reduce((s, l) => s + (l.totalDays || 0), 0) || 0;
      if (totalLeaveDays > 20) { riskScore += 15; factors.push('High leave usage'); }

      // Still in probation
      if (emp.status === 'probation') { riskScore += 10; factors.push('Still in probation'); }

      // Cap at 100
      riskScore = Math.min(riskScore, 100);
      const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name,
        position: emp.position?.title,
        tenureYears: Number(new Decimal(tenureYears).toDecimalPlaces(1)),
        riskScore,
        riskLevel,
        factors,
      };
    });

    riskScores.sort((a, b) => b.riskScore - a.riskScore);

    const high = riskScores.filter((r) => r.riskLevel === 'high').length;
    const medium = riskScores.filter((r) => r.riskLevel === 'medium').length;
    const low = riskScores.filter((r) => r.riskLevel === 'low').length;

    return {
      summary: {
        totalEmployees: riskScores.length,
        highRisk: high,
        mediumRisk: medium,
        lowRisk: low,
        highRiskPercentage: riskScores.length > 0 ? Number(new Decimal(high).div(riskScores.length).mul(100).toDecimalPlaces(1)) : 0,
      },
      employees: riskScores,
    };
  }

  // ── Workforce Cost Analysis ────────────────────────────────

  async getWorkforceCostAnalysis(tenantId: string) {
    const salaries = await this.prisma.salaryStructure.findMany({
      where: { tenantId },
      select: {
        basicSalary: true,
        hra: true,
        grossSalary: true,
        netSalary: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            position: { select: { title: true, grade: true } },
            employmentType: true,
          },
        },
      },
    });

    const totalCost = salaries.reduce((s, sal) => new Decimal(s).plus(sal.grossSalary || 0).toNumber(), 0);
    const annualCost = new Decimal(totalCost).mul(12).toNumber();

    const byDepartment = salaries.reduce<Record<string, { monthlyCost: number; employeeCount: number; avgSalary: number }>>((acc, sal) => {
      const dept = sal.employee?.department?.name || 'Unassigned';
      if (!acc[dept]) acc[dept] = { monthlyCost: 0, employeeCount: 0, avgSalary: 0 };
      acc[dept].monthlyCost = new Decimal(acc[dept].monthlyCost).plus(sal.grossSalary || 0).toNumber();
      acc[dept].employeeCount++;
      acc[dept].avgSalary = Number(new Decimal(acc[dept].monthlyCost).div(acc[dept].employeeCount).toDecimalPlaces(0));
      return acc;
    }, {});

    const byGrade = salaries.reduce<Record<string, { monthlyCost: number; count: number; avg: number }>>((acc, sal) => {
      const grade = sal.employee?.position?.grade || 'Ungraded';
      if (!acc[grade]) acc[grade] = { monthlyCost: 0, count: 0, avg: 0 };
      acc[grade].monthlyCost = new Decimal(acc[grade].monthlyCost).plus(sal.grossSalary || 0).toNumber();
      acc[grade].count++;
      acc[grade].avg = Number(new Decimal(acc[grade].monthlyCost).div(acc[grade].count).toDecimalPlaces(0));
      return acc;
    }, {});

    return {
      summary: {
        totalMonthlyPayroll: totalCost,
        estimatedAnnualPayroll: annualCost,
        totalEmployeesWithSalary: salaries.length,
        costPerEmployee: salaries.length > 0 ? Number(new Decimal(totalCost).div(salaries.length).toDecimalPlaces(0)) : 0,
      },
      byDepartment,
      byGrade,
    };
  }

  // ── Headcount Forecasting ──────────────────────────────────

  async getHeadcountForecast(tenantId: string, query: WorkforceQueryDto) {
    const months = query.forecastMonths || 6;
    const historicalMonths = 12;
    const now = new Date();

    // Gather historical data
    const history: { month: string; joins: number; exits: number; net: number }[] = [];
    for (let i = historicalMonths - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [joins, exits] = await Promise.all([
        this.prisma.employee.count({ where: { tenantId, dateOfJoining: { gte: start, lte: end } } }),
        this.prisma.employee.count({ where: { tenantId, dateOfSeparation: { gte: start, lte: end } } }),
      ]);

      history.push({
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        joins,
        exits,
        net: joins - exits,
      });
    }

    // Simple linear regression-based forecast
    const avgMonthlyJoins = history.reduce((s, h) => s + h.joins, 0) / historicalMonths;
    const avgMonthlyExits = history.reduce((s, h) => s + h.exits, 0) / historicalMonths;
    const avgNetGrowth = avgMonthlyJoins - avgMonthlyExits;

    const currentHeadcount = await this.prisma.employee.count({
      where: { tenantId, status: { in: ['active', 'probation', 'on_leave'] } },
    });

    const forecast: { month: string; projectedHeadcount: number; projectedJoins: number; projectedExits: number }[] = [];
    let projected = currentHeadcount;

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      projected += Math.round(avgNetGrowth);

      forecast.push({
        month: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
        projectedHeadcount: Math.max(projected, 0),
        projectedJoins: Math.round(avgMonthlyJoins),
        projectedExits: Math.round(avgMonthlyExits),
      });
    }

    return {
      currentHeadcount,
      avgMonthlyJoins: Number(new Decimal(avgMonthlyJoins).toDecimalPlaces(1)),
      avgMonthlyExits: Number(new Decimal(avgMonthlyExits).toDecimalPlaces(1)),
      avgNetGrowth: Number(new Decimal(avgNetGrowth).toDecimalPlaces(1)),
      history,
      forecast,
    };
  }

  // ── Skill Gap Analysis ─────────────────────────────────────

  async getSkillGapAnalysis(tenantId: string) {
    const skills = await this.prisma.skill.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        category: true,
        employees: { select: { proficiencyLevel: true } },
      },
    });

    const analysis = skills.map((skill) => {
      const totalEmployees = skill.employees.length;
      const avgProficiency = totalEmployees > 0
        ? Number(new Decimal(skill.employees.reduce((s, e) => s + (e.proficiencyLevel || 0), 0)).div(totalEmployees).toDecimalPlaces(1))
        : 0;

      const proficiencyDist = skill.employees.reduce<Record<number, number>>((acc, e) => {
        const level = e.proficiencyLevel || 0;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      const gapScore = totalEmployees === 0 ? 100 : Math.max(0, 100 - avgProficiency * 20);

      return {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        totalEmployees,
        avgProficiency,
        proficiencyDistribution: proficiencyDist,
        gapScore,
        gapLevel: gapScore >= 60 ? 'critical' : gapScore >= 30 ? 'moderate' : 'low',
      };
    });

    analysis.sort((a, b) => b.gapScore - a.gapScore);

    return {
      totalSkills: skills.length,
      criticalGaps: analysis.filter((a) => a.gapLevel === 'critical').length,
      moderateGaps: analysis.filter((a) => a.gapLevel === 'moderate').length,
      skills: analysis,
    };
  }

  // ── Department Comparison ──────────────────────────────────

  async getDepartmentComparison(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
        employees: {
          where: { status: { in: ['active', 'probation'] } },
          select: {
            id: true,
            dateOfJoining: true,
            dateOfSeparation: true,
            gender: true,
            employmentType: true,
            salaryStructure: { select: { grossSalary: true }, orderBy: { effectiveDate: 'desc' }, take: 1 },
          },
        },
      },
    });

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    return departments.map((dept) => {
      const empCount = dept.employees.length;
      const grossSalaries = dept.employees
        .filter((e) => e.salaryStructure?.length > 0)
        .map((e) => Number(e.salaryStructure[0].grossSalary || 0));

      const avgSalary = grossSalaries.length > 0
        ? Number(new Decimal(grossSalaries.reduce((s, v) => s + v, 0)).div(grossSalaries.length).toDecimalPlaces(0))
        : 0;

      const avgTenure = empCount > 0
        ? Number(new Decimal(
          dept.employees.reduce((s, e) => s + (now.getTime() - e.dateOfJoining.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 0)
        ).div(empCount).toDecimalPlaces(1))
        : 0;

      const genderBreakdown = dept.employees.reduce<Record<string, number>>((acc, e) => {
        acc[e.gender || 'unknown'] = (acc[e.gender || 'unknown'] || 0) + 1;
        return acc;
      }, {});

      const newJoinsThisYear = dept.employees.filter((e) => e.dateOfJoining >= yearStart).length;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        code: dept.code,
        headcount: empCount,
        avgSalary,
        avgTenureYears: avgTenure,
        genderBreakdown,
        newJoinsThisYear,
      };
    }).sort((a, b) => b.headcount - a.headcount);
  }

  // ── Overtime Analysis ──────────────────────────────────────

  async getOvertimeAnalysis(tenantId: string, months = 3) {
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId, date: { gte: start }, overtimeHours: { gt: 0 } },
      select: {
        date: true,
        overtimeHours: true,
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const totalOtHours = records.reduce((s, r) => new Decimal(s).plus(r.overtimeHours || 0).toNumber(), 0);

    const byEmployee = records.reduce<Record<string, { name: string; department: string; hours: number; days: number }>>((acc, r) => {
      const code = r.employee?.employeeCode || 'unknown';
      if (!acc[code]) {
        acc[code] = {
          name: `${r.employee?.firstName} ${r.employee?.lastName}`,
          department: r.employee?.department?.name || 'Unassigned',
          hours: 0,
          days: 0,
        };
      }
      acc[code].hours = new Decimal(acc[code].hours).plus(r.overtimeHours || 0).toNumber();
      acc[code].days++;
      return acc;
    }, {});

    const byDepartment = records.reduce<Record<string, { hours: number; records: number }>>((acc, r) => {
      const dept = r.employee?.department?.name || 'Unassigned';
      if (!acc[dept]) acc[dept] = { hours: 0, records: 0 };
      acc[dept].hours = new Decimal(acc[dept].hours).plus(r.overtimeHours || 0).toNumber();
      acc[dept].records++;
      return acc;
    }, {});

    return {
      summary: {
        totalOvertimeHours: Number(new Decimal(totalOtHours).toDecimalPlaces(1)),
        totalRecords: records.length,
        uniqueEmployees: Object.keys(byEmployee).length,
      },
      byEmployee: Object.entries(byEmployee)
        .map(([code, data]) => ({ employeeCode: code, ...data }))
        .sort((a, b) => b.hours - a.hours),
      byDepartment,
    };
  }
}
