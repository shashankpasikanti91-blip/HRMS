import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { GoalsService } from './goals.service';

@ApiTags('Goals')
@Controller('goals')
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create goal' })
  create(@Req() req: Request, @Body() dto: any) {
    return this.goalsService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List goals' })
  findAll(@Req() req: Request, @Query('employeeId') eid?: string, @Query('status') status?: string, @Query('cycleId') cid?: string) {
    return this.goalsService.findAll(req.headers['x-tenant-id'] as string, eid, status, cid);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get goal statistics' })
  getStats(@Req() req: Request, @Query('employeeId') eid?: string) {
    return this.goalsService.getGoalStats(req.headers['x-tenant-id'] as string, eid);
  }

  @Get('team/:managerId')
  @ApiOperation({ summary: 'Get team goals for manager' })
  getTeamGoals(@Req() req: Request, @Param('managerId') mid: string) {
    return this.goalsService.getTeamGoals(req.headers['x-tenant-id'] as string, mid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal details' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.goalsService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    return this.goalsService.update(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  updateProgress(@Req() req: Request, @Param('id') id: string, @Body() dto: { progress: number; currentValue?: number }) {
    return this.goalsService.updateProgress(req.headers['x-tenant-id'] as string, id, dto.progress, dto.currentValue);
  }
}
