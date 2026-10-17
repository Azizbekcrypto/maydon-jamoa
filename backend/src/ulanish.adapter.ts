import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import { ruxsatliManzillar } from './sanoq.js';

// Brauzerdan ulanish (ilovaning brauzer ko'rinishi — 7-dars, lendingdagi sanoq sahifasi — 8-dars): socket.io ham faqat
// WEB_ORIGIN dagi manzillarga ruxsat beradi — HTTP so'rovlardagi CORS bilan bir xil (main.ts).
// Telefondagi ilova brauzer emas — unga CORS kerak emas.
// WEB_ORIGIN o'qilishi — ishga tushganda (.env yuklangandan keyin), shuning uchun gateway dekoratorida emas, shu yerda.
export class UlanishAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const manzillar = ruxsatliManzillar();
    return super.createIOServer(port, manzillar.length ? ({ ...options, cors: { origin: manzillar } } as ServerOptions) : options);
  }
}
