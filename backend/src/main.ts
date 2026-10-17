import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ruxsatliManzillar } from './sanoq.js';
import { UlanishAdapter } from './ulanish.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Ilova (Expo) brauzer emas — unga CORS kerak emas. Brauzerdan so'rov (web-trek sayti, ilovaning brauzer ko'rinishi,
  // lendingdagi sanoq sahifasi) — faqat WEB_ORIGIN dagi manzillar (vergul bilan), yozilmagan bo'lsa CORS yoqilmaydi.
  const manzillar = ruxsatliManzillar();
  if (manzillar.length) {
    app.enableCors({ origin: manzillar });
  }
  // Doimiy ulanish (socket.io) uchun ham o'sha manzil — brauzer ko'rinishi ulana olsin
  app.useWebSocketAdapter(new UlanishAdapter(app));
  // Port — PORT o'zgaruvchisidan (Render o'zi beradi), u bo'lmasa — 3000 (laptop)
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
