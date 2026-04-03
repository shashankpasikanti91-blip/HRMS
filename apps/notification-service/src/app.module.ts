import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { EventListenersModule } from './modules/event-listeners/event-listeners.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    NotificationsModule,
    EmailModule,
    AnnouncementsModule,
    EventListenersModule,
  ],
})
export class AppModule {}
