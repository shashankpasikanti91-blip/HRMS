import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { NotificationNatsController } from './nats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    NotificationsModule,
    AnnouncementsModule,
  ],
  controllers: [NotificationNatsController],
})
export class AppModule {}
