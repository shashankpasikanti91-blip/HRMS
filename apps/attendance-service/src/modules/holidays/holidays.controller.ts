import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { HolidaysService } from './holidays.service';

@ApiTags('Holidays')
@Controller('holidays')
@ApiBearerAuth()
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a holiday' })
  create(@Req() req: Request, @Body() dto: { name: string; date: string; type?: string; isOptional?: boolean }) {
    return this.holidaysService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List holidays for a year' })
  findAll(@Req() req: Request, @Query('year') year?: number) {
    return this.holidaysService.findAll(req.headers['x-tenant-id'] as string, year);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a holiday' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.holidaysService.remove(req.headers['x-tenant-id'] as string, id);
  }
}
