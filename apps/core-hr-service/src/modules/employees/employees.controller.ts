// ============================================================
// SRP AI HRMS - Employees Controller
// ============================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesDto } from './dto';

// Inline JWT guard for microservice (validates token from API Gateway)
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Employees')
@Controller('employees')
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an employee' })
  create(@Req() req: Request, @Body() dto: CreateEmployeeDto) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees with filters' })
  findAll(@Req() req: Request, @Query() query: ListEmployeesDto) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.findAll(tenantId, query);
  }

  @Get('org-chart')
  @ApiOperation({ summary: 'Get organization chart' })
  getOrgChart(@Req() req: Request) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.getOrgChart(tenantId);
  }

  @Get('headcount')
  @ApiOperation({ summary: 'Get headcount analytics' })
  getHeadcount(@Req() req: Request) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.getHeadcount(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.findOne(tenantId, id);
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get direct reports' })
  getDirectReports(@Req() req: Request, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.getDirectReports(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const tenantId = req.headers['x-tenant-id'] as string || req['user']?.tenantId;
    return this.employeesService.update(tenantId, id, dto);
  }
}
