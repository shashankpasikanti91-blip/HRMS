import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('performance')
export class PerformanceRouteController {
  constructor(@Inject('PERFORMANCE_SERVICE') private readonly client: ClientProxy) {}

  // ── Goals ──
  @Get('goals')
  @ApiOperation({ summary: 'List goals' })
  getGoals(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('goals.findAll', query));
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create goal' })
  createGoal(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('goals.create', body));
  }

  @Get('goals/:id')
  @ApiOperation({ summary: 'Get goal' })
  getGoal(@Param('id') id: string) {
    return firstValueFrom(this.client.send('goals.findOne', { id }));
  }

  @Put('goals/:id')
  @ApiOperation({ summary: 'Update goal' })
  updateGoal(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('goals.update', { id, ...body }));
  }

  // ── Reviews ──
  @Get('reviews')
  @ApiOperation({ summary: 'List reviews' })
  getReviews(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('reviews.findAll', query));
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Create review' })
  createReview(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('reviews.create', body));
  }

  @Put('reviews/:id/submit')
  @ApiOperation({ summary: 'Submit review' })
  submitReview(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('reviews.submit', { id, ...body }));
  }

  // ── Review Cycles ──
  @Get('cycles')
  @ApiOperation({ summary: 'List review cycles' })
  getCycles(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('cycles.findAll', query));
  }

  @Post('cycles')
  @ApiOperation({ summary: 'Create review cycle' })
  createCycle(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('cycles.create', body));
  }

  @Put('cycles/:id/activate')
  @ApiOperation({ summary: 'Activate review cycle' })
  activateCycle(@Param('id') id: string) {
    return firstValueFrom(this.client.send('cycles.activate', { id }));
  }

  // ── Skills ──
  @Get('skills')
  @ApiOperation({ summary: 'List skills' })
  getSkills(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('skills.findAll', query));
  }

  @Post('skills')
  @ApiOperation({ summary: 'Create skill' })
  createSkill(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('skills.create', body));
  }

  @Post('skills/assign')
  @ApiOperation({ summary: 'Assign skill to employee' })
  assignSkill(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('skills.assign', body));
  }

  @Get('skills/gaps/:tenantId')
  @ApiOperation({ summary: 'Skill gap analysis' })
  getSkillGaps(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('skills.gapAnalysis', { tenantId }));
  }
}
