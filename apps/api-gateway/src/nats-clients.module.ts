import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

const natsClient = (name: string, queue: string) => ({
  name,
  useFactory: (cfg: ConfigService) => ({
    transport: Transport.NATS as number,
    options: {
      servers: [cfg.get('NATS_URL', 'nats://localhost:4222')],
      queue,
    },
  }),
  inject: [ConfigService],
});

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      natsClient('AUTH_SERVICE', 'auth-service'),
      natsClient('CORE_HR_SERVICE', 'core-hr-service'),
      natsClient('ATTENDANCE_SERVICE', 'attendance-service'),
      natsClient('PAYROLL_SERVICE', 'payroll-service'),
      natsClient('RECRUITMENT_SERVICE', 'recruitment-service'),
      natsClient('PERFORMANCE_SERVICE', 'performance-service'),
      natsClient('NOTIFICATION_SERVICE', 'notification-service'),
      natsClient('ANALYTICS_SERVICE', 'analytics-service'),
    ]),
  ],
  exports: [ClientsModule],
})
export class NatsClientsModule {}
