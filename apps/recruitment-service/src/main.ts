import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('SRP AI HRMS - Recruitment/ATS Service')
    .setDescription('Job postings, candidates, interviews, AI resume screening')
    .setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: { servers: [process.env.NATS_URL || 'nats://localhost:4222'], queue: 'recruitment-service' },
  });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 4005);
  console.log(`Recruitment Service running on port ${process.env.PORT || 4005}`);
}
bootstrap();
