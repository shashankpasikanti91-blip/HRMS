import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CyclesService } from './cycles.service';

@ApiTags('Review Cycles')
@Controller('cycles')
@ApiBearerAuth()
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Post()
  @ApiOperation({ summary: 'Create review cycle' })
  create(@Req() req: Request, @Body() dto: any) {
    return this.cyclesService.create(req.headers['x-tenant-id'] as string, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List review cycles' })
  findAll(@Req() req: Request) {
    return this.cyclesService.findAll(req.headers['x-tenant-id'] as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review cycle' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.cyclesService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review cycle' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    return this.cyclesService.update(req.headers['x-tenant-id'] as string, id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate review cycle' })
  activate(@Req() req: Request, @Param('id') id: string) {
    return this.cyclesService.activate(req.headers['x-tenant-id'] as string, id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete review cycle' })
  complete(@Req() req: Request, @Param('id') id: string) {
    return this.cyclesService.complete(req.headers['x-tenant-id'] as string, id);
  }
}
