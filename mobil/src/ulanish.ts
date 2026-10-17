import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { io, type Socket } from 'socket.io-client';

import { API, tokenOl } from '@/api';
import { oyinlarniOl } from '@/oyin';

// Doimiy ulanish (socket.io): ilova Backend'ga bir marta ulanadi, ulanish ochiq turadi.
// Manzil — o'sha EXPO_PUBLIC_API_URL; ulanayotganda token yuboriladi (auth) — Backend uni shu paytda tekshiradi.
// Hodisa oyin-ozgardi { oyinId, sabab } kelganda ilova GET /oyinlar ni bir marta qayta so'raydi —
// «O'yinlar» va «O'yin» shu bitta javobdan yangilanadi (oyin.ts). Hodisa o'zgarish bo'lganini aytadi; yangi holat — Backend'dan.

// Uch ulanish holati:
// ulangan — hodisalar keladi · ulanmoqda — ulanish yo'q, ilova o'zi ulanishga urinmoqda (birinchi marta yoki uzilgandan keyin) ·
// ulanmagan — ilova urinmayapti (token yo'q yoki yaroqsiz, yoki hisobdan chiqilgan)
export type UlanishHolati = 'ulangan' | 'ulanmoqda' | 'ulanmagan';

let ulanish: Socket | null = null;
let ilovaHolati: NativeEventSubscription | null = null;
let holat: UlanishHolati = 'ulanmagan';
const holatniKuzatuvchilar = new Set<(h: UlanishHolati) => void>();

// «Hozir ko'ryapti»: Backend xonaga yuborgan son — o'yin bo'yicha (korayotganlar-ozgardi { oyinId, soni })
const korayotganlar = new Map<number, number>();
const korayotganlarniKuzatuvchilar = new Set<() => void>();

function holatQoy(yangi: UlanishHolati) {
  holat = yangi;
  holatniKuzatuvchilar.forEach((k) => k(yangi));
}

// Uzilish yoki ulanish xatosidan keyin: socket.io o'zi qayta urinayotgan bo'lsa (active) — «ulanmoqda»,
// Backend yopgan bo'lsa (token yaroqsiz) yoki ilova o'zi yopgan bo'lsa — «ulanmagan»
function uzilishdanKeyin() {
  holatQoy(ulanish?.active ? 'ulanmoqda' : 'ulanmagan');
}

// Ulanishni ochadi — token o'qib bo'lingandan keyingina. Ulanish bor bo'lsa — qayta ochilmaydi:
// ekran necha marta ochilsa ham ulanish va uning tinglovchilari bitta.
export async function ulan() {
  if (ulanish) return;
  const token = await tokenOl();
  if (!token || ulanish) return;

  ulanish = io(API, { auth: { token } });
  holatQoy('ulanmoqda');
  ulanish.on('connect', () => {
    holatQoy('ulangan');
    ulanish?.on('oyin-ozgardi', () => {
      qaytaSora();
    });
  });
  ulanish.on('disconnect', uzilishdanKeyin);
  ulanish.on('connect_error', uzilishdanKeyin);
  ulanish.on('korayotganlar-ozgardi', (m: { oyinId: number; soni: number }) => {
    korayotganlar.set(m.oyinId, m.soni);
    korayotganlarniKuzatuvchilar.forEach((k) => k());
  });

  // Ilova fonda turganda o'zgarish bo'lsa: fondan qaytganda ro'yxat qayta so'raladi
  let oldingi: string | null | undefined = AppState.currentState;
  ilovaHolati = AppState.addEventListener('change', (yangi: AppStateStatus) => {
    if (oldingi === 'background' && yangi === 'active') qaytaSora();
    oldingi = yangi;
  });
}

// Hodisadan keyin — GET /oyinlar bir marta; xato bo'lsa ekranda eski ro'yxat qoladi (pastga tortib yangilash ishlaydi)
function qaytaSora() {
  oyinlarniOl().catch(() => {});
}

// Backend'ga hodisa yuborish (masalan, «O'yin» ekrani ochildi / yopildi). Ulanish bo'lmasa — hech narsa qilmaydi.
export function xabarYubor(nom: string, malumot: unknown) {
  ulanish?.emit(nom, malumot);
}

// «O'yin» ekrani uchun: shu o'yin ekranini hozir ochib turgan ulanishlar soni (hali kelmagan bo'lsa — null)
export function useKorayotganlar(oyinId: number): number | null {
  const [soni, setSoni] = useState(korayotganlar.get(oyinId) ?? null);
  useEffect(() => {
    const k = () => setSoni(korayotganlar.get(oyinId) ?? null);
    korayotganlarniKuzatuvchilar.add(k);
    return () => {
      korayotganlarniKuzatuvchilar.delete(k);
    };
  }, [oyinId]);
  return soni;
}

// «Hisobdan chiqish»: ulanish yopiladi. Qayta kirilganda ulan() yangi token bilan yangi ulanish ochadi.
export function uzil() {
  ilovaHolati?.remove();
  ilovaHolati = null;
  ulanish?.removeAllListeners();
  ulanish?.disconnect();
  ulanish = null;
  korayotganlar.clear();
  holatQoy('ulanmagan');
}

// Ekranda belgi uchun: hozirgi holat va uning o'zgarishi
export function useUlanishHolati(): UlanishHolati {
  const [h, setH] = useState(holat);
  useEffect(() => {
    holatniKuzatuvchilar.add(setH);
    setH(holat);
    return () => {
      holatniKuzatuvchilar.delete(setH);
    };
  }, []);
  return h;
}
