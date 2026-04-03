// ============================================================
// SRP AI HRMS - Roles Controller
// ============================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Create a role' })
  create(@Req() req: Request, @Body() dto: CreateRoleDto) {
    return this.rolesService.create((req as any).user.tenantId, dto);
  }

  @Get()
  @Roles('super-admin', 'admin', 'hr-manager')
  @ApiOperation({ summary: 'List all roles' })
  findAll(@Req() req: Request) {
    return this.rolesService.findAll((req as any).user.tenantId);
  }

  @Get('permissions')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Get all available permissions' })
  getPermissions(@Req() req: Request) {
    return this.rolesService.getPermissions((req as any).user.tenantId);
  }

  @Get(':id')
  @Roles('super-admin', 'admin', 'hr-manager')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.rolesService.findOne((req as any).user.tenantId, id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Update a role' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update((req as any).user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.rolesService.remove((req as any).user.tenantId, id);
  }
}
