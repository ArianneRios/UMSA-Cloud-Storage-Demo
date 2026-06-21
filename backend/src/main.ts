import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const frontendUrl = process.env.FRONTEND_URL;
  const origins = [
    'http://localhost:5173',
    'https://umsa-cloud-storage-demo.vercel.app'
  ];
  if (frontendUrl && !origins.includes(frontendUrl)) {
    origins.push(frontendUrl);
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
bootstrap();