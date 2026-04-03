import {
  Controller, Get, Post, Patch, Param, Query, Body, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll')
@Controller('payroll')
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('runs')
  @ApiOperation({ summary: 'Initiate payroll run' })
  initiateRun(@Req() req: Request, @Body() dto: { month: number; year: number; name?: string; createdById: string }) {
    return this.payrollService.initiatePayrollRun(req.headers['x-tenant-id'] as string, dto);
  }

  @Get('runs')
  @ApiOperation({ summary: 'List payroll runs' })
  listRuns(@Req() req: Request, @Query('year') year?: number) {
    return this.payrollService.listPayrollRuns(req.headers['x-tenant-id'] as string, year);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get payroll run' })
  getRun(@Req() req: Request, @Param('id') id: string) {
    return this.payrollService.getPayrollRun(req.headers['x-tenant-id'] as string, id);
  }

  @Patch('runs/:id/process')
  @ApiOperation({ summary: 'Process payroll run' })
  processRun(@Req() req: Request, @Param('id') id: string, @Body() dto: { processedById: string }) {
    return this.payrollService.processPayrollRun(req.headers['x-tenant-id'] as string, id, dto.processedById);
  }

  @Patch('runs/:id/approve')
  @ApiOperation({ summary: 'Approve payroll run' })
  approveRun(@Req() req: Request, @Param('id') id: string, @Body() dto: { approvedById: string }) {
    return this.payrollService.approvePayrollRun(req.headers['x-tenant-id'] as string, id, dto.approvedById);
  }

  @Get('runs/:id/payslips')
  @ApiOperation({ summary: 'Get payslips for a run' })
  getRunPayslips(@Req() req: Request, @Param('id') id: string) {
    return this.payrollService.getPayslipsByRun(req.headers['x-tenant-id'] as string, id);
  }

  @Get('payslips/:employeeId')
  @ApiOperation({ summary: 'Get employee payslip history' })
  getEmployeeHistory(@Req() req: Request, @Param('employeeId') eid: string) {
    return this.payrollService.getEmployeePayslipHistory(req.headers['x-tenant-id'] as string, eid);
  }

  @Get('payslips/:employeeId/:year/:month')
  @ApiOperation({ summary: 'Get specific payslip' })
  getPayslip(@Req() req: Request, @Param('employeeId') eid: string, @Param('year') year: number, @Param('month') month: number) {
    return this.payrollService.getEmployeePayslip(req.headers['x-tenant-id'] as string, eid, month, year);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payroll stats for a year' })
  getStats(@Req() req: Request, @Query('year') year: number) {
    return this.payrollService.getPayrollStats(req.headers['x-tenant-id'] as string, year || new Date().getFullYear());
  }
}
