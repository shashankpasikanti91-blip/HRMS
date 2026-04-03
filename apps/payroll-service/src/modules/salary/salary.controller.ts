import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SalaryService } from './salary.service';

@ApiTags('Salary Structures')
@Controller('salary')
@ApiBearerAuth()
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post(':employeeId')
  @ApiOperation({ summary: 'Create or update salary structure' })
  upsert(@Req() req: Request, @Param('employeeId') eid: string, @Body() dto: any) {
    return this.salaryService.upsert(req.headers['x-tenant-id'] as string, eid, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all salary structures' })
  findAll(@Req() req: Request) {
    return this.salaryService.findAll(req.headers['x-tenant-id'] as string);
  }

  @Get(':employeeId')
  @ApiOperation({ summary: 'Get salary by employee' })
  findByEmployee(@Req() req: Request, @Param('employeeId') eid: string) {
    return this.salaryService.findByEmployee(req.headers['x-tenant-id'] as string, eid);
  }
}
