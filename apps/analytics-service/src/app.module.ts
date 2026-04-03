import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WorkforceAnalyticsModule } from './modules/workforce-analytics/workforce-analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    DashboardsModule,
    ReportsModule,
    WorkforceAnalyticsModule,
  ],
})
export class AppModule {}
