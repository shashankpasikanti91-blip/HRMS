import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PositionsService } from './positions.service';

@ApiTags('Positions')
@Controller('positions')
@ApiBearerAuth()
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a position' })
  create(@Req() req: Request, @Body() dto: { title: string; code: string; description?: string; departmentId?: string; level?: number; minSalary?: number; maxSalary?: number }) {
    return this.positionsService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List positions' })
  findAll(@Req() req: Request, @Query('departmentId') departmentId?: string) {
    return this.positionsService.findAll(req.headers['x-tenant-id'] as string, departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get position by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.positionsService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update position' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: { title?: string; description?: string; departmentId?: string; level?: number; minSalary?: number; maxSalary?: number }) {
    return this.positionsService.update(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete position' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.positionsService.remove(req.headers['x-tenant-id'] as string, id);
  }
}
