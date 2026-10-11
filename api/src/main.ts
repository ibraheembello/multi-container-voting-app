import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // All routes live under /api so nginx can proxy a single prefix.
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // The browser talks to the same origin through nginx in production; CORS is
  // mainly for local development against the Vite dev server.
  app.enableCors({ origin: true, credentials: true });

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API listening on :${port} (prefix /api)`);
}

void bootstrap();
