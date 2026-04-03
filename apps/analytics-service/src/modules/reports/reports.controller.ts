import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report by type (headcount, turnover, attendance, payroll, etc.)' })
  generateReport(@Body() dto: GenerateReportDto) {
    return this.reportsService.generateReport(dto);
  }
}
