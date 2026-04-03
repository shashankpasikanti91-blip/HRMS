import { Module } from '@nestjs/common';
import { AnalyticsRouteController } from './analytics-route.controller';

@Module({ controllers: [AnalyticsRouteController] })
export class AnalyticsRouteModule {}
