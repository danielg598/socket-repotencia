import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;

  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(json({ limit: '60mb' }));
  app.enableVersioning({ defaultVersion: '1', type: VersioningType.URI })
  const config = new DocumentBuilder()
    .setTitle('api sockets nest js')
    .setDescription('este es el servidor de socket del chat de repotencia')
    .setVersion('1.0')
    // .addTag('')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log('___env___', process.env.PORT);

  await app.listen(PORT);
}
bootstrap();

// faltan pasar el main.ts
