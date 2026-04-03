import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JobsService } from './jobs.service';

@ApiTags('Job Postings')
@Controller('jobs')
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create job posting' })
  create(@Req() req: Request, @Body() dto: any) {
    return this.jobsService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List job postings' })
  findAll(@Req() req: Request, @Query('status') status?: string) {
    return this.jobsService.findAll(req.headers['x-tenant-id'] as string, status);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public job listings (career page)' })
  getPublicJobs(@Req() req: Request) {
    return this.jobsService.getPublicJobs(req.headers['x-tenant-id'] as string);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get recruitment pipeline' })
  getPipeline(@Req() req: Request) {
    return this.jobsService.getRecruitmentPipeline(req.headers['x-tenant-id'] as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job posting' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.jobsService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job posting' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    return this.jobsService.update(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish job posting' })
  publish(@Req() req: Request, @Param('id') id: string) {
    return this.jobsService.publish(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close job posting' })
  close(@Req() req: Request, @Param('id') id: string) {
    return this.jobsService.close(req.headers['x-tenant-id'] as string, id);
  }
}
