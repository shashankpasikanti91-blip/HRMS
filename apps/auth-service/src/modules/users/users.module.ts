// ============================================================
// SRP AI HRMS - Users Module
// ============================================================

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersNatsController } from './users-nats.controller';

@Module({
  controllers: [UsersController, UsersNatsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
