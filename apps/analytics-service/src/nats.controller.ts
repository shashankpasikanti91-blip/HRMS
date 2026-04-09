// ============================================================
// SRP AI HRMS - Analytics NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DashboardsService } from './modules/dashboards/dashboards.service';
import { ReportsService } from './modules/reports/reports.service';
import { WorkforceAnalyticsService } from './modules/workforce-analytics/workforce-analytics.service';

@Controller()
export class AnalyticsNatsController {
  constructor(
    private readonly dashboardsService: DashboardsService,
    private readonly reportsService: ReportsService,
    private readonly workforceService: WorkforceAnalyticsService,
  ) {}

  // ── Dashboards ──

  @MessagePattern('dashboards.executive')
  async getExecutiveDashboard(@Payload() data: any) {
    return this.dashboardsService.getExecutiveDashboard(data.tenantId, data);
  }

  @MessagePattern('dashboards.headcount')
  async getHeadcountSummary(@Payload() data: any) {
    return this.dashboardsService.getHeadcountSummary(data.tenantId);
  }

  @MessagePattern('dashboards.turnover')
  async getTurnoverMetrics(@Payload() data: any) {
    return this.dashboardsService.getTurnoverMetrics(data.tenantId, data);
  }

  @MessagePattern('dashboards.attendance')
  async getAttendanceOverview(@Payload() data: any) {
    return this.dashboardsService.getAttendanceOverview(data.tenantId, data);
  }

  @MessagePattern('dashboards.payroll')
  async getPayrollOverview(@Payload() data: any) {
    return this.dashboardsService.getPayrollOverview(data.tenantId, data);
  }

  @MessagePattern('dashboards.recruitment')
  async getRecruitmentPipeline(@Payload() data: any) {
    return this.dashboardsService.getRecruitmentPipeline(data.tenantId);
  }

  @MessagePattern('dashboards.performance')
  async getPerformanceSnapshot(@Payload() data: any) {
    // Aggregate performance data from review cycles and goals
    const [headcount, recruitment] = await Promise.all([
      this.dashboardsService.getHeadcountSummary(data.tenantId),
      this.dashboardsService.getRecruitmentPipeline(data.tenantId),
    ]);
    return { headcount, recruitment, tenantId: data.tenantId };
  }

  // ── Reports ──

  @MessagePattern('reports.generate')
  async generateReport(@Payload() data: any) {
    return this.reportsService.generateReport(data);
  }

  // ── Workforce Analytics ──

  @MessagePattern('workforce.attritionRisk')
  async getAttritionRisk(@Payload() data: any) {
    return this.workforceService.getAttritionRiskAnalysis(data.tenantId);
  }

  @MessagePattern('workforce.costAnalysis')
  async getCostAnalysis(@Payload() data: any) {
    return this.workforceService.getWorkforceCostAnalysis(data.tenantId);
  }

  @MessagePattern('workforce.headcountForecast')
  async getHeadcountForecast(@Payload() data: any) {
    return this.workforceService.getHeadcountForecast(data.tenantId, data);
  }

  @MessagePattern('workforce.skillGaps')
  async getSkillGaps(@Payload() data: any) {
    return this.workforceService.getSkillGapAnalysis(data.tenantId);
  }

  @MessagePattern('workforce.departmentComparison')
  async getDepartmentComparison(@Payload() data: any) {
    return this.workforceService.getDepartmentComparison(data.tenantId);
  }

  @MessagePattern('workforce.overtime')
  async getOvertimeAnalysis(@Payload() data: any) {
    return this.workforceService.getOvertimeAnalysis(data.tenantId, data.months || 3);
  }
}
