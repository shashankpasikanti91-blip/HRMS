import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('executive/:tenantId')
  @ApiOperation({ summary: 'Executive dashboard with all key metrics' })
  getExecutiveDashboard(@Param('tenantId') tenantId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardsService.getExecutiveDashboard(tenantId, query);
  }

  @Get('headcount/:tenantId')
  @ApiOperation({ summary: 'Headcount summary and demographics' })
  getHeadcountSummary(@Param('tenantId') tenantId: string) {
    return this.dashboardsService.getHeadcountSummary(tenantId);
  }

  @Get('headcount-trend/:tenantId')
  @ApiOperation({ summary: 'Headcount trend over months' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getHeadcountTrend(@Param('tenantId') tenantId: string, @Query('months') months?: number) {
    return this.dashboardsService.getHeadcountTrend(tenantId, months || 12);
  }

  @Get('departments/:tenantId')
  @ApiOperation({ summary: 'Department breakdown with percentages' })
  getDepartmentBreakdown(@Param('tenantId') tenantId: string) {
    return this.dashboardsService.getDepartmentBreakdown(tenantId);
  }

  @Get('turnover/:tenantId')
  @ApiOperation({ summary: 'Turnover metrics and rates' })
  getTurnoverMetrics(@Param('tenantId') tenantId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardsService.getTurnoverMetrics(tenantId, query);
  }

  @Get('attendance/:tenantId')
  @ApiOperation({ summary: 'Attendance overview and rates' })
  getAttendanceOverview(@Param('tenantId') tenantId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardsService.getAttendanceOverview(tenantId, query);
  }

  @Get('attendance-trend/:tenantId')
  @ApiOperation({ summary: 'Daily attendance trend' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getAttendanceTrend(@Param('tenantId') tenantId: string, @Query('days') days?: number) {
    return this.dashboardsService.getAttendanceTrend(tenantId, days || 30);
  }

  @Get('payroll/:tenantId')
  @ApiOperation({ summary: 'Payroll overview' })
  getPayrollOverview(@Param('tenantId') tenantId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardsService.getPayrollOverview(tenantId, query);
  }

  @Get('payroll-trend/:tenantId')
  @ApiOperation({ summary: 'Payroll trend over months' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getPayrollTrend(@Param('tenantId') tenantId: string, @Query('months') months?: number) {
    return this.dashboardsService.getPayrollTrend(tenantId, months || 12);
  }

  @Get('recruitment/:tenantId')
  @ApiOperation({ summary: 'Recruitment pipeline overview' })
  getRecruitmentPipeline(@Param('tenantId') tenantId: string) {
    return this.dashboardsService.getRecruitmentPipeline(tenantId);
  }

  @Get('performance/:tenantId')
  @ApiOperation({ summary: 'Performance review snapshot' })
  getPerformanceSnapshot(@Param('tenantId') tenantId: string) {
    return this.dashboardsService.getPerformanceSnapshot(tenantId);
  }

  @Get('leaves/:tenantId')
  @ApiOperation({ summary: 'Leave analytics and breakdown' })
  getLeaveAnalytics(@Param('tenantId') tenantId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardsService.getLeaveAnalytics(tenantId, query);
  }
}
