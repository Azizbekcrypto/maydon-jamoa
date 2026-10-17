import { timingSafeEqual } from 'node:crypto';

// Sanoq sahifasining maxfiy kaliti (12-Modul 8-dars) — backend/.env va Render'dagi SANOQ_KALITI.
// Kodga yozilmaydi; .env da bo'lmasa — sanoq hech kimga ochilmaydi. Kalitni bilgan har kim ochadi: chiqib ketsa — yangisini qo'ying.
export function sanoqKalitiTogrimi(kalit: unknown): boolean {
  const asl = process.env.SANOQ_KALITI;
  if (!asl || typeof kalit !== 'string' || !kalit) return false;
  const a = Buffer.from(kalit);
  const b = Buffer.from(asl);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Brauzerdan ruxsat etilgan manzillar (CORS): WEB_ORIGIN — bir yoki bir nechta manzil, vergul bilan
// (masalan, ilovaning brauzer ko'rinishi va lending — sanoq sahifasi uchun)
export function ruxsatliManzillar(): string[] {
  return (process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((m) => m.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
