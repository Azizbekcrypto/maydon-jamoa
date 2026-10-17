import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { UlanishAdapter } from './ulanish.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Ilova (Expo) brauzer emas — unga CORS kerak emas. Brauzerdan so'rov (web-trek sayti yoki ilovaning brauzer ko'rinishi) —
  // faqat WEB_ORIGIN dagi manzil (masalan Netlify), yozilmagan bo'lsa CORS yoqilmaydi.
  if (process.env.WEB_ORIGIN) {
    app.enableCors({ origin: process.env.WEB_ORIGIN.replace(/\/+$/, '') });
  }
  // Doimiy ulanish (socket.io) uchun ham o'sha manzil — brauzer ko'rinishi ulana olsin
  app.useWebSocketAdapter(new UlanishAdapter(app));
  // Port — PORT o'zgaruvchisidan (Render o'zi beradi), u bo'lmasa — 3000 (laptop)
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
