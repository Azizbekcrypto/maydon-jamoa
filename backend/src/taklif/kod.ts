import { randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import type { Oyinchi } from '../oyinchi.entity.js';

// Taklif kodi (13-Modul 10-dars): 6 belgi, katta harf va raqam (A–Z, 0–9), jadvalda noyob. Maxfiy emas — u bo'yicha hisob haqida
// hech narsa ko'rsatilmaydi; ism va login yo'q.
const BELGILAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const TAKLIF_KODI_QOIDASI = /^[A-Z0-9]{6}$/;

export function yangiTaklifKodi(): string {
  return Array.from(randomBytes(6), (b) => BELGILAR[b % BELGILAR.length]).join('');
}

// Noyoblik to'qnashuvi aynan taklif kodida bo'ldimi (login band bo'lishi — boshqa xato)
export function taklifKodiToqnashdi(e: unknown): boolean {
  const x = e as { code?: string; detail?: string };
  return x.code === '23505' && !!x.detail?.includes('taklif_kodi');
}

// Mavjud hisoblarning har biriga bir marta (kodi bo'sh bo'lganlarga): bor kod almashmaydi, hisob o'chirilmaydi.
// To'qnashsa — yangi kod bilan qayta yoziladi (oldindan tekshirib emas).
export async function taklifKodisizlargaBer(oyinchilar: Repository<Oyinchi>): Promise<number> {
  const kodsizlar = await oyinchilar.find({ where: { taklif_kodi: IsNull() }, select: { id: true } });
  for (const o of kodsizlar) {
    for (;;) {
      try {
        await oyinchilar.update({ id: o.id, taklif_kodi: IsNull() }, { taklif_kodi: yangiTaklifKodi() });
        break;
      } catch (e) {
        if (!taklifKodiToqnashdi(e)) throw e;
      }
    }
  }
  return kodsizlar.length;
}
