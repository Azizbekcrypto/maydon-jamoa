import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Ilova (Expo) brauzer emas — unga CORS kerak emas. Web-trekda sayt so'rov yubora olishi uchun —
  // faqat WEB_ORIGIN dagi manzil (masalan Netlify), yozilmagan bo'lsa CORS yoqilmaydi.
  if (process.env.WEB_ORIGIN) {
    app.enableCors({ origin: process.env.WEB_ORIGIN.replace(/\/+$/, '') });
  }
  await app.listen(3000);
}
await bootstrap();
