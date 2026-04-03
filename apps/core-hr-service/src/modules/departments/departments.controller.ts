import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { DepartmentsService } from './departments.service';

@ApiTags('Departments')
@Controller('departments')
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a department' })
  create(@Req() req: Request, @Body() dto: { name: string; code: string; description?: string; headId?: string; parentId?: string }) {
    const tenantId = req.headers['x-tenant-id'] as string;
    return this.departmentsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List departments' })
  findAll(@Req() req: Request) {
    return this.departmentsService.findAll(req.headers['x-tenant-id'] as string);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get department tree' })
  getTree(@Req() req: Request) {
    return this.departmentsService.getTree(req.headers['x-tenant-id'] as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.departmentsService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: { name?: string; description?: string; headId?: string; parentId?: string }) {
    return this.departmentsService.update(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.departmentsService.remove(req.headers['x-tenant-id'] as string, id);
  }
}
