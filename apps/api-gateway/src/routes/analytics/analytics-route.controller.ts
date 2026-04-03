import { Controller, Get, Post, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsRouteController {
  constructor(@Inject('ANALYTICS_SERVICE') private readonly client: ClientProxy) {}

  // ── Dashboards ──
  @Get('dashboards/executive/:tenantId')
  @ApiOperation({ summary: 'Executive dashboard' })
  getExecutiveDashboard(@Param('tenantId') tenantId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('dashboards.executive', { tenantId, ...query }));
  }

  @Get('dashboards/headcount/:tenantId')
  @ApiOperation({ summary: 'Headcount summary' })
  getHeadcount(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('dashboards.headcount', { tenantId }));
  }

  @Get('dashboards/turnover/:tenantId')
  @ApiOperation({ summary: 'Turnover metrics' })
  getTurnover(@Param('tenantId') tenantId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('dashboards.turnover', { tenantId, ...query }));
  }

  @Get('dashboards/attendance/:tenantId')
  @ApiOperation({ summary: 'Attendance overview' })
  getAttendanceOverview(@Param('tenantId') tenantId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('dashboards.attendance', { tenantId, ...query }));
  }

  @Get('dashboards/payroll/:tenantId')
  @ApiOperation({ summary: 'Payroll overview' })
  getPayrollOverview(@Param('tenantId') tenantId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('dashboards.payroll', { tenantId, ...query }));
  }

  @Get('dashboards/recruitment/:tenantId')
  @ApiOperation({ summary: 'Recruitment pipeline' })
  getRecruitmentPipeline(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('dashboards.recruitment', { tenantId }));
  }

  @Get('dashboards/performance/:tenantId')
  @ApiOperation({ summary: 'Performance snapshot' })
  getPerformanceSnapshot(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('dashboards.performance', { tenantId }));
  }

  // ── Reports ──
  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate report' })
  generateReport(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('reports.generate', body));
  }

  // ── Workforce Analytics ──
  @Get('workforce/attrition-risk/:tenantId')
  @ApiOperation({ summary: 'Attrition risk analysis' })
  getAttritionRisk(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('workforce.attritionRisk', { tenantId }));
  }

  @Get('workforce/cost-analysis/:tenantId')
  @ApiOperation({ summary: 'Workforce cost analysis' })
  getCostAnalysis(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('workforce.costAnalysis', { tenantId }));
  }

  @Get('workforce/headcount-forecast/:tenantId')
  @ApiOperation({ summary: 'Headcount forecasting' })
  getHeadcountForecast(@Param('tenantId') tenantId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('workforce.headcountForecast', { tenantId, ...query }));
  }

  @Get('workforce/skill-gaps/:tenantId')
  @ApiOperation({ summary: 'Skill gap analysis' })
  getSkillGaps(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('workforce.skillGaps', { tenantId }));
  }

  @Get('workforce/department-comparison/:tenantId')
  @ApiOperation({ summary: 'Department comparison' })
  getDepartmentComparison(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('workforce.departmentComparison', { tenantId }));
  }

  @Get('workforce/overtime/:tenantId')
  @ApiOperation({ summary: 'Overtime analysis' })
  getOvertimeAnalysis(@Param('tenantId') tenantId: string, @Query('months') months?: number) {
    return firstValueFrom(this.client.send('workforce.overtime', { tenantId, months }));
  }
}
