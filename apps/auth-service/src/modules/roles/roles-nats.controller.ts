// ============================================================
// SRP AI HRMS - Roles NATS Message Handler
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';

@Controller()
export class RolesNatsController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern('roles.findAll')
  async findAll(@Payload() data: any) {
    return this.rolesService.findAll(data.tenantId);
  }

  @MessagePattern('roles.create')
  async create(@Payload() data: any) {
    const { tenantId, ...createData } = data;
    return this.rolesService.create(tenantId, createData);
  }
}
