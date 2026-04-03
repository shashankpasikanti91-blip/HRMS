import { Module } from '@nestjs/common';
import { AuthRouteController } from './auth-route.controller';

@Module({ controllers: [AuthRouteController] })
export class AuthRouteModule {}
