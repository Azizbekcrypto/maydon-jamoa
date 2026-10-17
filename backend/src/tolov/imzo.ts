import { createHmac, timingSafeEqual } from 'node:crypto';

// To'lov xabarining imzosi: HMAC SHA-256 (tana, TOLOV_KALITI), hex — 64 belgi.
// Kalit faqat backend/.env va Render'da (TOLOV_KALITI); kodga, logga va README'ga yozilmaydi.
export function imzola(tana: string | Buffer, kalit: string): string {
  return createHmac('sha256', kalit).update(tana).digest('hex');
}

// Imzo mos keldimi. Kalit bo'sh bo'lsa — hech bir xabar qabul qilinmaydi.
// Avval shakli (64 belgili hex) tekshiriladi: timingSafeEqual uzunligi har xil buferda xato tashlaydi.
export function imzoTogrimi(xomTana: Buffer | undefined, imzo: unknown): boolean {
  const kalit = process.env.TOLOV_KALITI;
  if (!kalit || !xomTana || typeof imzo !== 'string' || !/^[0-9a-f]{64}$/i.test(imzo)) return false;
  const kutilgan = Buffer.from(imzola(xomTana, kalit), 'hex');
  return timingSafeEqual(Buffer.from(imzo, 'hex'), kutilgan);
}
