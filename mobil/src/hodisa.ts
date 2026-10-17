import * as SecureStore from 'expo-secure-store';

import { API } from '@/api';

// Qadamlar sanog'i (12-Modul 7-dars): ochdi → royxatdan-otdi → qoshildi → tasdiqladi.
// Har qadam — POST /hodisalar { nom, qurilma_id }. Faqat qadam nomi va qurilma ID: ism, login va token yuborilmaydi.
// Qurilma ID — birinchi ochilishda yaratiladigan tasodifiy harf va raqamlar, telefonda saqlanadi:
// bitta qurilmadagi ilovani ajratadi, odamning ismini ham, loginini ham bildirmaydi.
export type Qadam = 'ochdi' | 'royxatdan-otdi' | 'qoshildi' | 'tasdiqladi';

const KALIT = 'qurilma_id';
let qurilmaId: string | null = null;

function tasodifiyId(): string {
  const belgilar = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 24 }, () => belgilar[Math.floor(Math.random() * belgilar.length)]).join('');
}

async function qurilmaIdOl(): Promise<string> {
  if (qurilmaId) return qurilmaId;
  qurilmaId = await SecureStore.getItemAsync(KALIT);
  if (!qurilmaId) {
    qurilmaId = tasodifiyId();
    await SecureStore.setItemAsync(KALIT, qurilmaId);
  }
  return qurilmaId;
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
