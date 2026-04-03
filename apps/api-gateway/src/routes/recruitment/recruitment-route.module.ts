import { Module } from '@nestjs/common';
import { RecruitmentRouteController } from './recruitment-route.controller';

@Module({ controllers: [RecruitmentRouteController] })
export class RecruitmentRouteModule {}
