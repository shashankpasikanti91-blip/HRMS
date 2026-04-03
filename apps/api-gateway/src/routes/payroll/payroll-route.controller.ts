import { Controller, Get, Post, Put, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollRouteController {
  constructor(@Inject('PAYROLL_SERVICE') private readonly client: ClientProxy) {}

  @Post('runs/initiate')
  @ApiOperation({ summary: 'Initiate payroll run' })
  initiateRun(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('payroll.initiate', body));
  }

  @Post('runs/:id/process')
  @ApiOperation({ summary: 'Process payroll run' })
  processRun(@Param('id') id: string) {
    return firstValueFrom(this.client.send('payroll.process', { id }));
  }

  @Put('runs/:id/approve')
  @ApiOperation({ summary: 'Approve payroll run' })
  approveRun(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('payroll.approve', { id, ...body }));
  }

  @Get('runs')
  @ApiOperation({ summary: 'List payroll runs' })
  getRuns(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('payroll.findAll', query));
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get payroll run details' })
  getRun(@Param('id') id: string) {
    return firstValueFrom(this.client.send('payroll.findOne', { id }));
  }

  @Get('payslips/:employeeId')
  @ApiOperation({ summary: 'Get employee payslips' })
  getPayslips(@Param('employeeId') employeeId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('payslips.byEmployee', { employeeId, ...query }));
  }

  // ── Salary ──
  @Get('salary/:employeeId')
  @ApiOperation({ summary: 'Get salary structure' })
  getSalary(@Param('employeeId') employeeId: string) {
    return firstValueFrom(this.client.send('salary.findOne', { employeeId }));
  }

  @Post('salary')
  @ApiOperation({ summary: 'Create/update salary structure' })
  upsertSalary(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('salary.upsert', body));
  }
}
