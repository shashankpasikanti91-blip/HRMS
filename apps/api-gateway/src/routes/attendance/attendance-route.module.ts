import { Module } from '@nestjs/common';
import { AttendanceRouteController } from './attendance-route.controller';

@Module({ controllers: [AttendanceRouteController] })
export class AttendanceRouteModule {}
