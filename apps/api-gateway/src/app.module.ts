import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { NatsClientsModule } from './nats-clients.module';
import { AuthRouteModule } from './routes/auth/auth-route.module';
import { CoreHrRouteModule } from './routes/core-hr/core-hr-route.module';
import { AttendanceRouteModule } from './routes/attendance/attendance-route.module';
import { PayrollRouteModule } from './routes/payroll/payroll-route.module';
import { RecruitmentRouteModule } from './routes/recruitment/recruitment-route.module';
import { PerformanceRouteModule } from './routes/performance/performance-route.module';
import { NotificationRouteModule } from './routes/notification/notification-route.module';
import { AnalyticsRouteModule } from './routes/analytics/analytics-route.module';
import { HealthController } from './routes/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),
    NatsClientsModule,
    AuthRouteModule,
    CoreHrRouteModule,
    AttendanceRouteModule,
    PayrollRouteModule,
    RecruitmentRouteModule,
    PerformanceRouteModule,
    NotificationRouteModule,
    AnalyticsRouteModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
