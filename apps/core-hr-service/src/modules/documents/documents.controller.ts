import {
  Controller, Get, Post, Delete, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@Controller('documents')
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload / register a document' })
  create(@Req() req: Request, @Body() dto: any) {
    const tenantId = req.headers['x-tenant-id'] as string;
    return this.documentsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  findAll(
    @Req() req: Request,
    @Query('employeeId') employeeId?: string,
    @Query('category') category?: string,
  ) {
    return this.documentsService.findAll(req.headers['x-tenant-id'] as string, employeeId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.documentsService.findOne(req.headers['x-tenant-id'] as string, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.documentsService.remove(req.headers['x-tenant-id'] as string, id);
  }
}
