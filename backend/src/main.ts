import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://umsa-cloud-storage-demo.vercel.app'
    ],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();