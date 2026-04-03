import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';

@ApiTags('Performance Reviews')
@Controller('reviews')
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create performance review' })
  create(@Req() req: Request, @Body() dto: any) {
    return this.reviewsService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List performance reviews' })
  findAll(@Req() req: Request, @Query('cycleId') cid?: string, @Query('employeeId') eid?: string, @Query('status') status?: string) {
    return this.reviewsService.findAll(req.headers['x-tenant-id'] as string, cid, eid, status);
  }

  @Get('stats/:cycleId')
  @ApiOperation({ summary: 'Get review stats for cycle' })
  getStats(@Req() req: Request, @Param('cycleId') cid: string) {
    return this.reviewsService.getReviewStats(req.headers['x-tenant-id'] as string, cid);
  }

  @Get('my/:employeeId')
  @ApiOperation({ summary: 'Get my reviews' })
  getMyReviews(@Req() req: Request, @Param('employeeId') eid: string) {
    return this.reviewsService.getMyReviews(req.headers['x-tenant-id'] as string, eid);
  }

  @Get('pending/:reviewerId')
  @ApiOperation({ summary: 'Get pending reviews for reviewer' })
  getPending(@Req() req: Request, @Param('reviewerId') rid: string) {
    return this.reviewsService.getPendingReviews(req.headers['x-tenant-id'] as string, rid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review details' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.reviewsService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit review with ratings' })
  submit(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    return this.reviewsService.submitReview(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve review' })
  approve(@Req() req: Request, @Param('id') id: string) {
    return this.reviewsService.approveReview(req.headers['x-tenant-id'] as string, id);
  }
}
