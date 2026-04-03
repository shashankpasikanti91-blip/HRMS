import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CandidatesService } from './candidates.service';

@ApiTags('Candidates')
@Controller('candidates')
@ApiBearerAuth()
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @ApiOperation({ summary: 'Add candidate' })
  create(@Req() req: Request, @Body() dto: any) {
    return this.candidatesService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List candidates' })
  findAll(@Req() req: Request, @Query('jobPostingId') jobId?: string, @Query('stage') stage?: string) {
    return this.candidatesService.findAll(req.headers['x-tenant-id'] as string, jobId, stage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.candidatesService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    return this.candidatesService.update(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move candidate to next stage' })
  updateStage(@Req() req: Request, @Param('id') id: string, @Body() dto: { stage: string; notes?: string }) {
    return this.candidatesService.updateStage(req.headers['x-tenant-id'] as string, id, dto.stage, dto.notes);
  }
}
