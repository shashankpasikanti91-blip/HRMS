import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CyclesModule } from './modules/cycles/cycles.module';
import { SkillsModule } from './modules/skills/skills.module';
import { PerformanceNatsController } from './nats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    GoalsModule,
    ReviewsModule,
    CyclesModule,
    SkillsModule,
  ],
  controllers: [PerformanceNatsController],
})
export class AppModule {}
