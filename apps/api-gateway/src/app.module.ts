import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
      { name: 'short', ttl: 1000, limit: 10 },     // 10 requests/second
      { name: 'medium', ttl: 60000, limit: 100 },   // 100 requests/minute
      { name: 'long', ttl: 3600000, limit: 1000 },  // 1000 requests/hour
    ]),
    ClientsModule.registerAsync([
      { name: 'AUTH_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'auth-service' } }), inject: [ConfigService] },
      { name: 'CORE_HR_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'core-hr-service' } }), inject: [ConfigService] },
      { name: 'ATTENDANCE_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'attendance-service' } }), inject: [ConfigService] },
      { name: 'PAYROLL_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'payroll-service' } }), inject: [ConfigService] },
      { name: 'RECRUITMENT_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'recruitment-service' } }), inject: [ConfigService] },
      { name: 'PERFORMANCE_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'performance-service' } }), inject: [ConfigService] },
      { name: 'NOTIFICATION_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'notification-service' } }), inject: [ConfigService] },
      { name: 'ANALYTICS_SERVICE', useFactory: (cfg: ConfigService) => ({ transport: Transport.NATS, options: { servers: [cfg.get('NATS_URL', 'nats://localhost:4222')], queue: 'analytics-service' } }), inject: [ConfigService] },
    ]),
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
