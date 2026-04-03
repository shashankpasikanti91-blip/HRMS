import { Module } from '@nestjs/common';
import { NotificationRouteController } from './notification-route.controller';

@Module({ controllers: [NotificationRouteController] })
export class NotificationRouteModule {}
