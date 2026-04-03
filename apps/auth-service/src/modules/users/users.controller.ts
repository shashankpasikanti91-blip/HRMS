// ============================================================
// SRP AI HRMS - Users Controller
// ============================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateUserDto, UpdateUserDto, ListUsersDto } from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a user' })
  create(@Req() req: Request, @Body() dto: CreateUserDto) {
    return this.usersService.create((req as any).user.tenantId, dto);
  }

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'List all users' })
  findAll(@Req() req: Request, @Query() query: ListUsersDto) {
    return this.usersService.findAll((req as any).user.tenantId, query);
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.usersService.findOne((req as any).user.tenantId, id);
  }

  @Patch(':id')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update a user' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update((req as any).user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.usersService.remove((req as any).user.tenantId, id);
  }
}
