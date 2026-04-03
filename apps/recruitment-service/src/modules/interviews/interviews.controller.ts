import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { InterviewsService } from './interviews.service';

@ApiTags('Interviews')
@Controller('interviews')
@ApiBearerAuth()
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule interview' })
  schedule(@Req() req: Request, @Body() dto: any) {
    return this.interviewsService.schedule(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List interviews' })
  findAll(@Req() req: Request, @Query('candidateId') cid?: string, @Query('jobPostingId') jid?: string, @Query('status') status?: string) {
    return this.interviewsService.findAll(req.headers['x-tenant-id'] as string, { candidateId: cid, jobPostingId: jid, status });
  }

  @Get('upcoming/:interviewerId')
  @ApiOperation({ summary: 'Get upcoming interviews for interviewer' })
  getUpcoming(@Req() req: Request, @Param('interviewerId') iid: string) {
    return this.interviewsService.getUpcoming(req.headers['x-tenant-id'] as string, iid);
  }

  @Patch(':id/feedback')
  @ApiOperation({ summary: 'Submit interview feedback' })
  submitFeedback(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    return this.interviewsService.submitFeedback(req.headers['x-tenant-id'] as string, id, dto);
  }
}
