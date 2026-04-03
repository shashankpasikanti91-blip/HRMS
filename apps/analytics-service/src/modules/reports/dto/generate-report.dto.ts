import { IsOptional, IsString, IsDateString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  HEADCOUNT = 'headcount',
  TURNOVER = 'turnover',
  ATTENDANCE = 'attendance',
  PAYROLL = 'payroll',
  LEAVE = 'leave',
  RECRUITMENT = 'recruitment',
  PERFORMANCE = 'performance',
  COMPENSATION = 'compensation',
  DIVERSITY = 'diversity',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ enum: ReportFormat, default: ReportFormat.JSON })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupBy?: string;
}
