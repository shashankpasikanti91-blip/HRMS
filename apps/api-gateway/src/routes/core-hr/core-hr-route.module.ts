import { Module } from '@nestjs/common';
import { CoreHrRouteController } from './core-hr-route.controller';

@Module({ controllers: [CoreHrRouteController] })
export class CoreHrRouteModule {}
