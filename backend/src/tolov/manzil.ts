import type { Request } from 'express';

// Backend'ning ochiq manzili: Render'da RENDER_EXTERNAL_URL (Render o'zi beradi); laptopda — so'rov kelgan manzil
// (telefon Backend'ni qaysi manzil bilan topgan bo'lsa, mashq sahifasi ham o'sha manzilda ochiladi)
export function ochiqManzil(sorov: Request): string {
  const render = process.env.RENDER_EXTERNAL_URL;
  if (render) return render.replace(/\/+$/, '');
  return `${sorov.protocol}://${sorov.get('host')}`;
}

// Mashq sahifasi to'lov xabarini yuboradigan manzil — Backend'ning o'zi: Render'da RENDER_EXTERNAL_URL, laptopda — localhost
export function ozManzil(): string {
  return (process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/+$/, '');
}
