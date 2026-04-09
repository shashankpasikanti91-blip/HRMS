// ============================================================
// SRP AI HRMS - Core HR App Module
// ============================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PositionsModule } from './modules/positions/positions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CoreHrNatsController } from './nats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    EmployeesModule,
    DepartmentsModule,
    PositionsModule,
    DocumentsModule,
  ],
  controllers: [CoreHrNatsController],
})
export class AppModule {}
