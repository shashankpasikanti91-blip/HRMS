// ============================================================
// SRP AI HRMS - Payroll NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PayrollService } from './modules/payroll/payroll.service';
import { SalaryService } from './modules/salary/salary.service';

@Controller()
export class PayrollNatsController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly salaryService: SalaryService,
  ) {}

  // ── Payroll Runs ──

  @MessagePattern('payroll.initiate')
  async initiateRun(@Payload() data: any) {
    return this.payrollService.initiatePayrollRun(data.tenantId, data);
  }

  @MessagePattern('payroll.process')
  async processRun(@Payload() data: any) {
    return this.payrollService.processPayrollRun(data.tenantId, data.id, data.processedById);
  }

  @MessagePattern('payroll.approve')
  async approveRun(@Payload() data: any) {
    return this.payrollService.approvePayrollRun(data.tenantId, data.id, data.approvedById);
  }

  @MessagePattern('payroll.findAll')
  async findAllRuns(@Payload() data: any) {
    return this.payrollService.listPayrollRuns(data.tenantId, data.year);
  }

  @MessagePattern('payroll.findOne')
  async findOneRun(@Payload() data: any) {
    return this.payrollService.getPayrollRun(data.tenantId, data.id);
  }

  @MessagePattern('payroll.stats')
  async getStats(@Payload() data: any) {
    return this.payrollService.getPayrollStats(data.tenantId, data.year || new Date().getFullYear());
  }

  // ── Payslips ──

  @MessagePattern('payslips.byEmployee')
  async getEmployeePayslips(@Payload() data: any) {
    return this.payrollService.getEmployeePayslipHistory(data.tenantId, data.employeeId);
  }

  @MessagePattern('payslips.specific')
  async getSpecificPayslip(@Payload() data: any) {
    return this.payrollService.getEmployeePayslip(data.tenantId, data.employeeId, data.month, data.year);
  }

  // ── Salary ──

  @MessagePattern('salary.findOne')
  async findSalary(@Payload() data: any) {
    return this.salaryService.findByEmployee(data.tenantId, data.employeeId);
  }

  @MessagePattern('salary.upsert')
  async upsertSalary(@Payload() data: any) {
    const { tenantId, employeeId, ...dto } = data;
    return this.salaryService.upsert(tenantId, employeeId, dto);
  }

  @MessagePattern('salary.findAll')
  async findAllSalaries(@Payload() data: any) {
    return this.salaryService.findAll(data.tenantId);
  }
}
