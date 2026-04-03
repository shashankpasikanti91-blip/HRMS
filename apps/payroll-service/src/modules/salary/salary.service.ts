import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async upsert(tenantId: string, employeeId: string, data: {
    basicSalary: number;
    hra?: number;
    da?: number;
    otherAllowances?: number;
    pfContribution?: number;
    esiContribution?: number;
    tds?: number;
    otherDeductions?: number;
    bankName?: string;
    bankAccountNo?: string;
    ifscCode?: string;
    ctc?: number;
    effectiveFrom?: string;
  }) {
    return this.prisma.salaryStructure.upsert({
      where: { employeeId },
      create: {
        tenantId,
        employeeId,
        basicSalary: data.basicSalary,
        hra: data.hra || 0,
        da: data.da || 0,
        otherAllowances: data.otherAllowances || 0,
        pfContribution: data.pfContribution || 0,
        esiContribution: data.esiContribution || 0,
        tds: data.tds || 0,
        otherDeductions: data.otherDeductions || 0,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        ifscCode: data.ifscCode,
        ctc: data.ctc,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      },
      update: {
        basicSalary: data.basicSalary,
        hra: data.hra,
        da: data.da,
        otherAllowances: data.otherAllowances,
        pfContribution: data.pfContribution,
        esiContribution: data.esiContribution,
        tds: data.tds,
        otherDeductions: data.otherDeductions,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        ifscCode: data.ifscCode,
        ctc: data.ctc,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      },
    });
  }

  async findByEmployee(tenantId: string, employeeId: string) {
    const salary = await this.prisma.salaryStructure.findFirst({
      where: { tenantId, employeeId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
    if (!salary) throw new NotFoundException('Salary structure not found');
    return salary;
  }

  async findAll(tenantId: string) {
    return this.prisma.salaryStructure.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { firstName: 'asc' } },
    });
  }
}
