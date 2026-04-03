import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WorkforceAnalyticsService } from './workforce-analytics.service';
import { WorkforceQueryDto } from './dto/workforce-query.dto';

@ApiTags('Workforce Analytics')
@ApiBearerAuth()
@Controller('workforce-analytics')
export class WorkforceAnalyticsController {
  constructor(private readonly workforceService: WorkforceAnalyticsService) {}

  @Get('attrition-risk/:tenantId')
  @ApiOperation({ summary: 'AI-powered attrition risk scoring for all employees' })
  getAttritionRisk(@Param('tenantId') tenantId: string) {
    return this.workforceService.getAttritionRiskAnalysis(tenantId);
  }

  @Get('cost-analysis/:tenantId')
  @ApiOperation({ summary: 'Workforce cost analysis by department and grade' })
  getCostAnalysis(@Param('tenantId') tenantId: string) {
    return this.workforceService.getWorkforceCostAnalysis(tenantId);
  }

  @Get('headcount-forecast/:tenantId')
  @ApiOperation({ summary: 'Headcount forecasting based on historical trends' })
  getHeadcountForecast(@Param('tenantId') tenantId: string, @Query() query: WorkforceQueryDto) {
    return this.workforceService.getHeadcountForecast(tenantId, query);
  }

  @Get('skill-gaps/:tenantId')
  @ApiOperation({ summary: 'Skill gap analysis across the organization' })
  getSkillGaps(@Param('tenantId') tenantId: string) {
    return this.workforceService.getSkillGapAnalysis(tenantId);
  }

  @Get('department-comparison/:tenantId')
  @ApiOperation({ summary: 'Department comparison metrics' })
  getDepartmentComparison(@Param('tenantId') tenantId: string) {
    return this.workforceService.getDepartmentComparison(tenantId);
  }

  @Get('overtime/:tenantId')
  @ApiOperation({ summary: 'Overtime analysis by employee and department' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getOvertimeAnalysis(@Param('tenantId') tenantId: string, @Query('months') months?: number) {
    return this.workforceService.getOvertimeAnalysis(tenantId, months || 3);
  }
}
