import { Module } from '@nestjs/common';
import { PerformanceRouteController } from './performance-route.controller';

@Module({ controllers: [PerformanceRouteController] })
export class PerformanceRouteModule {}
