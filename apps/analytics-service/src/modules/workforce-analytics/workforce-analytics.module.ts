import { Module } from '@nestjs/common';
import { WorkforceAnalyticsController } from './workforce-analytics.controller';
import { WorkforceAnalyticsService } from './workforce-analytics.service';

@Module({
  controllers: [WorkforceAnalyticsController],
  providers: [WorkforceAnalyticsService],
  exports: [WorkforceAnalyticsService],
})
export class WorkforceAnalyticsModule {}
