import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();
  app.enableCors({ origin: true, credentials: true });

  // Global DTO validation + transformation (e.g. multipart string -> number).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve uploaded photos at /uploads/<filename>.
  const uploadDir = config.get<string>('app.uploadDir') ?? './uploads';
  app.useStaticAssets(resolve(process.cwd(), uploadDir), {
    prefix: '/uploads/',
  });

  // OpenAPI / Swagger UI at /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HR Management API')
    .setDescription(
      'Production-grade HR Management backend. Authenticate via ' +
        '`POST /auth/login` and use the returned JWT (Authorize button) for all ' +
        'protected routes. Every response is wrapped in a standard envelope.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);

  logger.log(`HTTP server listening on http://localhost:${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/api/docs`);
}

void bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap application:', error);
  process.exitCode = 1;
});
