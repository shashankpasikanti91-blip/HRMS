import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SkillsService } from './skills.service';

@ApiTags('Skills & Competencies')
@Controller('skills')
@ApiBearerAuth()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create skill' })
  create(@Req() req: Request, @Body() dto: any) {
    return this.skillsService.createSkill(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List skills' })
  findAll(@Req() req: Request, @Query('category') cat?: string) {
    return this.skillsService.findAllSkills(req.headers['x-tenant-id'] as string, cat);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign/update employee skill' })
  assign(@Req() req: Request, @Body() dto: { employeeId: string; skillId: string; level: number }) {
    return this.skillsService.assignSkill(req.headers['x-tenant-id'] as string, dto.employeeId, dto.skillId, dto.level);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get employee skills' })
  getEmployeeSkills(@Req() req: Request, @Param('employeeId') eid: string) {
    return this.skillsService.getEmployeeSkills(req.headers['x-tenant-id'] as string, eid);
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Get skill matrix' })
  getMatrix(@Req() req: Request, @Query('departmentId') did?: string) {
    return this.skillsService.getSkillMatrix(req.headers['x-tenant-id'] as string, did);
  }

  @Get('gap/:positionId')
  @ApiOperation({ summary: 'Get skill gap analysis for position' })
  getGap(@Req() req: Request, @Param('positionId') pid: string) {
    return this.skillsService.getSkillGap(req.headers['x-tenant-id'] as string, pid);
  }
}
