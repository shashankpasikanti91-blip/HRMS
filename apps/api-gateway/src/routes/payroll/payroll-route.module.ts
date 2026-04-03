import { Module } from '@nestjs/common';
import { PayrollRouteController } from './payroll-route.controller';

@Module({ controllers: [PayrollRouteController] })
export class PayrollRouteModule {}
