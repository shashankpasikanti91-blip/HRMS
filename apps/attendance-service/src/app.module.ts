import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { AttendanceNatsController } from './nats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AttendanceModule,
    LeavesModule,
    HolidaysModule,
  ],
  controllers: [AttendanceNatsController],
})
export class AppModule {}
