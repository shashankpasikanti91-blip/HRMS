import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { SalaryModule } from './modules/salary/salary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    PayrollModule,
    SalaryModule,
  ],
})
export class AppModule {}
