// src/main.ts
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const enProduccion = process.env.NODE_ENV === 'production';

  // En Render, Vercel o cPanel la app está detrás de un proxy: así se lee la
  // IP real del visitante (la usan los límites de JB Assist y del Libro de Reclamaciones).
  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Habilitar CORS usando la lista validada por configuración.
  app.enableCors({
    origin: configService.get<string[]>('cors.origin') || [],
    credentials: true,
  });

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Bootcamp Platform API')
    .setDescription('API REST para Plataforma Educativa Bootcamp')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Courses', 'Gestión de cursos')
    .addTag('Enrollments', 'Gestión de inscripciones')
    .addTag('Progress', 'Seguimiento de progreso')
    .addTag('Evaluations', 'Gestión de evaluaciones')
    .build();

  // La documentación (Swagger) se publica en desarrollo. En producción solo si SWAGGER=true.
  const conSwagger = !enProduccion || process.env.SWAGGER === 'true';
  if (conSwagger) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Bootcamp API running on port ${port} (${enProduccion ? 'producción' : 'desarrollo'})`);
  if (conSwagger) console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});
