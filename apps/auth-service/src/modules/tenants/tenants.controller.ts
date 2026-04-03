// ============================================================
// SRP AI HRMS - Tenants Controller
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new tenant (onboarding)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get('by-slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get tenant by slug (public, for login page)' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants (super admin)' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super-admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant details' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super-admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend a tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
