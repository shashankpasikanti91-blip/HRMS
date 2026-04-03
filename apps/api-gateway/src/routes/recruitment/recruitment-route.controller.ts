import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Recruitment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recruitment')
export class RecruitmentRouteController {
  constructor(@Inject('RECRUITMENT_SERVICE') private readonly client: ClientProxy) {}

  // ── Jobs ──
  @Get('jobs')
  @ApiOperation({ summary: 'List job postings' })
  getJobs(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('jobs.findAll', query));
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Create job posting' })
  createJob(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('jobs.create', body));
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job posting' })
  getJob(@Param('id') id: string) {
    return firstValueFrom(this.client.send('jobs.findOne', { id }));
  }

  @Put('jobs/:id')
  @ApiOperation({ summary: 'Update job posting' })
  updateJob(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('jobs.update', { id, ...body }));
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete job posting' })
  deleteJob(@Param('id') id: string) {
    return firstValueFrom(this.client.send('jobs.delete', { id }));
  }

  // ── Candidates ──
  @Get('candidates')
  @ApiOperation({ summary: 'List candidates' })
  getCandidates(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('candidates.findAll', query));
  }

  @Post('candidates')
  @ApiOperation({ summary: 'Create candidate' })
  createCandidate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('candidates.create', body));
  }

  @Get('candidates/:id')
  @ApiOperation({ summary: 'Get candidate' })
  getCandidate(@Param('id') id: string) {
    return firstValueFrom(this.client.send('candidates.findOne', { id }));
  }

  @Put('candidates/:id/stage')
  @ApiOperation({ summary: 'Update candidate pipeline stage' })
  updateCandidateStage(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('candidates.updateStage', { id, ...body }));
  }

  // ── Interviews ──
  @Get('interviews')
  @ApiOperation({ summary: 'List interviews' })
  getInterviews(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('interviews.findAll', query));
  }

  @Post('interviews')
  @ApiOperation({ summary: 'Schedule interview' })
  scheduleInterview(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('interviews.create', body));
  }

  @Put('interviews/:id/feedback')
  @ApiOperation({ summary: 'Submit interview feedback' })
  submitFeedback(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('interviews.feedback', { id, ...body }));
  }
}
