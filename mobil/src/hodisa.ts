import { API, sora } from '@/api';
import { ol, saqla } from '@/saqlash';

// Qadamlar sanog'i (12-Modul 7-dars): ochdi → royxatdan-otdi → qoshildi → tasdiqladi.
// Har qadam — POST /hodisalar { nom, qurilma_id }. Faqat qadam nomi va qurilma ID: ism, login va token yuborilmaydi.
// Qurilma ID — birinchi ochilishda yaratiladigan tasodifiy harf va raqamlar, telefonda saqlanadi (brauzer ko'rinishida — brauzerda):
// bitta qurilmadagi ilovani ajratadi, odamning ismini ham, loginini ham bildirmaydi.
// eslatmadan-ochdi (9-dars) — qadam emas, sanoq yozuvi: ilovaning istalgan eslatmasi bosilib ilova ochildi.
// telegramdan-ochdi (13-Modul 8-dars) — sanoq yozuvi: brauzer ko'rinishi Telegram xabaridagi havola (?kanal=telegram) bilan ochildi.
export type Qadam = 'ochdi' | 'royxatdan-otdi' | 'qoshildi' | 'tasdiqladi' | 'eslatmadan-ochdi' | 'telegramdan-ochdi';

const KALIT = 'qurilma_id';
let qurilmaId: string | null = null;

function tasodifiyId(): string {
  const belgilar = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 24 }, () => belgilar[Math.floor(Math.random() * belgilar.length)]).join('');
}

// Qurilma ID taklif mukofotida ham ishlatiladi (13-Modul 10-dars): ro'yxatdan o'tishda, kirishda va «Havolani ulashish»da
// Backend'ga yuboriladi (hisobning qurilmalari). «Hisobdan chiqish» uni o'chirmaydi — qurilma o'zgarmaydi.
export async function qurilmaIdOl(): Promise<string> {
  if (qurilmaId) return qurilmaId;
  qurilmaId = await ol(KALIT);
  if (!qurilmaId) {
    qurilmaId = tasodifiyId();
    await saqla(KALIT, qurilmaId);
  }
  return qurilmaId;
}

// Kirgan hisobning qurilmalari ro'yxatiga shu qurilma (POST /men/qurilma). O'tmasa ham ilova ishlayveradi.
export async function qurilmaniYoz() {
  try {
    await sora('/men/qurilma', { method: 'POST', body: { qurilmaId: await qurilmaIdOl() } });
  } catch {
    // jim: keyingi kirish yoki ulashishda yana yuboriladi
  }
}

// Ish muvaffaqiyatli tugagandan keyin chaqiriladi. So'rov o'tmasa ham ilova ishlayveradi — foydalanuvchiga xato ko'rsatilmaydi.
export async function hodisaYoz(nom: Qadam) {
  try {
    await fetch(`${API}/hodisalar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, qurilma_id: await qurilmaIdOl() }),
    });
  } catch {
    // jim: sanoq — ilovaning asosiy ishi emas
  }
}
