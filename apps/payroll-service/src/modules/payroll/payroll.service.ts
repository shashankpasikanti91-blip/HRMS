// ============================================================
// SRP AI HRMS - Payroll Service (Core Engine)
// ============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // Initiate a payroll run
  async initiatePayrollRun(tenantId: string, data: {
    month: number;
    year: number;
    name?: string;
    createdById: string;
  }) {
    // Check for existing run
    const existing = await this.prisma.payrollRun.findFirst({
      where: { tenantId, month: data.month, year: data.year },
    });
    if (existing) {
      throw new BadRequestException(`Payroll run for ${data.month}/${data.year} already exists`);
    }

    // Get all active employees with salary structures
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active' },
      include: { salaryStructure: true },
    });

    // Create payroll run
    const payrollRun = await this.prisma.payrollRun.create({
      data: {
        tenantId,
        name: data.name || `Payroll ${data.month}/${data.year}`,
        month: data.month,
        year: data.year,
        status: 'draft',
        totalEmployees: employees.length,
        createdById: data.createdById,
      },
    });

    // Generate payslips for each employee
    for (const emp of employees) {
      if (!emp.salaryStructure) continue;

      const salary = emp.salaryStructure;
      const basic = new Decimal(salary.basicSalary);
      const hra = new Decimal(salary.hra || 0);
      const da = new Decimal(salary.da || 0);
      const otherAllowances = new Decimal(salary.otherAllowances || 0);

      const grossSalary = basic.plus(hra).plus(da).plus(otherAllowances);

      // Deductions
      const pf = new Decimal(salary.pfContribution || 0);
      const esi = new Decimal(salary.esiContribution || 0);
      const tax = new Decimal(salary.tds || 0);
      const otherDeductions = new Decimal(salary.otherDeductions || 0);

      const totalDeductions = pf.plus(esi).plus(tax).plus(otherDeductions);
      const netSalary = grossSalary.minus(totalDeductions);

      await this.prisma.payslip.create({
        data: {
          tenantId,
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          month: data.month,
          year: data.year,
          basicSalary: basic.toNumber(),
          hra: hra.toNumber(),
          da: da.toNumber(),
          otherAllowances: otherAllowances.toNumber(),
          grossSalary: grossSalary.toNumber(),
          pfDeduction: pf.toNumber(),
          esiDeduction: esi.toNumber(),
          taxDeduction: tax.toNumber(),
          otherDeductions: otherDeductions.toNumber(),
          totalDeductions: totalDeductions.toNumber(),
          netSalary: netSalary.toNumber(),
          status: 'draft',
          earnings: {
            basic: basic.toNumber(),
            hra: hra.toNumber(),
            da: da.toNumber(),
            otherAllowances: otherAllowances.toNumber(),
          },
          deductions: {
            pf: pf.toNumber(),
            esi: esi.toNumber(),
            tax: tax.toNumber(),
            other: otherDeductions.toNumber(),
          },
        },
      });
    }

    // Update totals
    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: payrollRun.id },
    });

    const totalGross = payslips.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalDeductionsSum = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);
    const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0);

    await this.prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
        totalGross,
        totalDeductions: totalDeductionsSum,
        totalNet,
        totalEmployees: payslips.length,
      },
    });

    return this.getPayrollRun(tenantId, payrollRun.id);
  }

  // Get payroll run with summary
  async getPayrollRun(tenantId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { payslips: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  // List payroll runs
  async listPayrollRuns(tenantId: string, year?: number) {
    const where: Record<string, unknown> = { tenantId };
    if (year) where.year = year;

    return this.prisma.payrollRun.findMany({
      where,
      include: { _count: { select: { payslips: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // Process payroll (change status to processing → processed)
  async processPayrollRun(tenantId: string, id: string, processedById: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, tenantId, status: 'draft' },
    });
    if (!run) throw new BadRequestException('Payroll run not found or not in draft status');

    // Update all payslips to processed
    await this.prisma.payslip.updateMany({
      where: { payrollRunId: id },
      data: { status: 'processed' },
    });

    return this.prisma.payrollRun.update({
      where: { id },
      data: {
        status: 'processed',
        processedAt: new Date(),
        processedById,
      },
    });
  }

  // Approve payroll
  async approvePayrollRun(tenantId: string, id: string, approvedById: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, tenantId, status: 'processed' },
    });
    if (!run) throw new BadRequestException('Payroll run not found or not processed');

    await this.prisma.payslip.updateMany({
      where: { payrollRunId: id },
      data: { status: 'approved' },
    });

    return this.prisma.payrollRun.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedById,
      },
    });
  }

  // Get payslips for a payroll run
  async getPayslipsByRun(tenantId: string, payrollRunId: string) {
    return this.prisma.payslip.findMany({
      where: { tenantId, payrollRunId },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            employeeCode: true, department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { firstName: 'asc' } },
    });
  }

  // Get employee payslip
  async getEmployeePayslip(tenantId: string, employeeId: string, month: number, year: number) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { tenantId, employeeId, month, year },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeCode: true,
            department: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
        payrollRun: { select: { name: true, status: true } },
      },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }

  // Get employee payslip history
  async getEmployeePayslipHistory(tenantId: string, employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { tenantId, employeeId },
      select: {
        id: true, month: true, year: true, grossSalary: true,
        totalDeductions: true, netSalary: true, status: true,
        paidAt: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // Dashboard stats
  async getPayrollStats(tenantId: string, year: number) {
    const runs = await this.prisma.payrollRun.findMany({
      where: { tenantId, year },
    });

    return {
      year,
      totalRuns: runs.length,
      totalGrossYTD: runs.reduce((s, r) => s + (r.totalGross || 0), 0),
      totalDeductionsYTD: runs.reduce((s, r) => s + (r.totalDeductions || 0), 0),
      totalNetYTD: runs.reduce((s, r) => s + (r.totalNet || 0), 0),
      byMonth: runs.map((r) => ({
        month: r.month,
        status: r.status,
        totalGross: r.totalGross,
        totalNet: r.totalNet,
        employees: r.totalEmployees,
      })),
    };
  }
}
