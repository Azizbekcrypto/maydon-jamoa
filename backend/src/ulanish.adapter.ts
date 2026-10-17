import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

// Brauzerdan ulanish (ilovaning brauzer ko'rinishi, 12-Modul 7-dars): socket.io ham faqat WEB_ORIGIN dagi manzilga ruxsat beradi —
// HTTP so'rovlardagi CORS bilan bir xil (main.ts). Telefondagi ilova brauzer emas — unga CORS kerak emas.
// WEB_ORIGIN o'qilishi — ishga tushganda (.env yuklangandan keyin), shuning uchun gateway dekoratorida emas, shu yerda.
export class UlanishAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const manzil = process.env.WEB_ORIGIN?.replace(/\/+$/, '');
    return super.createIOServer(port, manzil ? ({ ...options, cors: { origin: manzil } } as ServerOptions) : options);
  }
}
