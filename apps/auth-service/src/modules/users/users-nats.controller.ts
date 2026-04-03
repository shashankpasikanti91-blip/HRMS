// ============================================================
// SRP AI HRMS - Users NATS Message Handler
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersNatsController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.findAll')
  async findAll(@Payload() data: any) {
    return this.usersService.findAll(data.tenantId, data);
  }

  @MessagePattern('users.findOne')
  async findOne(@Payload() data: any) {
    // When called from API Gateway for /auth/users/me, we need to handle it
    if (data.id) {
      // Find user by ID across all tenants (for /me endpoint)
      return this.usersService.findById(data.id);
    }
    return this.usersService.findOne(data.tenantId, data.id);
  }

  @MessagePattern('users.update')
  async update(@Payload() data: any) {
    const { id, tenantId, ...updateData } = data;
    return this.usersService.update(tenantId, id, updateData);
  }

  @MessagePattern('users.create')
  async create(@Payload() data: any) {
    const { tenantId, ...createData } = data;
    return this.usersService.create(tenantId, createData);
  }
}
