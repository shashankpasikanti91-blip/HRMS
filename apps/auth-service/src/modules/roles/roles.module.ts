// ============================================================
// SRP AI HRMS - Roles Module
// ============================================================

import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesNatsController } from './roles-nats.controller';

@Module({
  controllers: [RolesController, RolesNatsController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
