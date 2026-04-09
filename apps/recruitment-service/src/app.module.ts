import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { RecruitmentNatsController } from './nats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    JobsModule,
    CandidatesModule,
    InterviewsModule,
  ],
  controllers: [RecruitmentNatsController],
})
export class AppModule {}
