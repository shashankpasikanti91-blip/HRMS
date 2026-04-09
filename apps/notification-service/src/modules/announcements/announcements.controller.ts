import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AnnouncementsService } from './announcements.service';

@ApiTags('Announcements')
@Controller('announcements')
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  findAll(@Req() req: Request, @Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.announcementsService.findAll(req.headers['x-tenant-id'] as string, { status, page, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Create announcement' })
  create(@Req() req: Request, @Body() body: any) {
    return this.announcementsService.create(req.headers['x-tenant-id'] as string, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update announcement' })
  update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.announcementsService.update(req.headers['x-tenant-id'] as string, id, body);
  }
}
