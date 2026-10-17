import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { io, type Socket } from 'socket.io-client';

import { API, tokenOl } from '@/api';
import { kunNomi } from '@/kun';
import { oxirgiRoyxat, oyinlarniOl, type Oyin } from '@/oyin';

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
    ulanish?.on('oyin-ozgardi', async () => {
      const oldingi = oxirgiRoyxat();
      const yangi = await qaytaSora();
      if (oldingi && yangi) jonliXabarlar(oldingi, yangi).forEach(jonliXabarQosh);
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
function qaytaSora(): Promise<Oyin[] | null> {
  return oyinlarniOl().catch(() => null);
}

// Jonli xabar — ilova ochiq turganda ekran tepasida bir necha soniya chiqadigan qisqa xabar (_layout.tsx ko'rsatadi).
// Qaysi xabar — sababga qarab emas: hodisadan keyingi javob oldingisi bilan solishtiriladi.
// Faqat o'ziga tegishli o'yin uchun (qo'shilgan, navbatda yoki o'zi e'lon qilgan); o'z harakati uchun chiqmaydi; ism yo'q.
// O'z harakati — javobdagi o'z maydonlarim (menQoshilganman, menNavbatdaman, menTasdiqlaganman) o'zgargan
// (navbatdan o'yinga o'tish bundan mustasno). Hodisaga yangi maydon qo'shilmagan.
export function jonliXabarlar(oldingi: Oyin[], yangi: Oyin[]): string[] {
  const xabarlar: string[] = [];
  for (const y of yangi) {
    const o = oldingi.find((x) => x.id === y.id);
    if (!o) continue; // yangi e'lon — ro'yxatda jim paydo bo'ladi
    const nom = `${kunNomi(y.kun)}, ${y.soat}`;
    if (o.menNavbatdaman && y.menQoshilganman) {
      xabarlar.push(`Navbatdan o'yinga o'tdingiz: ${nom}`);
      continue;
    }
    const tegishli = y.menQoshilganman || y.menNavbatdaman || y.menTashkilotchiman;
    const ozim =
      o.menQoshilganman !== y.menQoshilganman ||
      o.menNavbatdaman !== y.menNavbatdaman ||
      o.menTasdiqlaganman !== y.menTasdiqlaganman;
    if (!tegishli || ozim) continue;
    if (y.qoshilgan > o.qoshilgan) {
      xabarlar.push(
        y.qoshilgan >= y.kerak
          ? `${nom} — o'yin to'ldi: ${y.qoshilgan} / ${y.kerak}`
          : `${nom} — yana bir o'yinchi qo'shildi: ${y.qoshilgan} / ${y.kerak}`,
      );
    } else if (y.qoshilgan < o.qoshilgan) {
      xabarlar.push(`${nom} — joy bo'shadi: ${y.qoshilgan} / ${y.kerak}`);
    }
    // Son o'zgarmasa (chiqqan o'rniga navbatdagi kirdi) — boshqalarga xabar yo'q
    if (y.tasdiqlagan !== null && o.tasdiqlagan !== null && y.tasdiqlagan > o.tasdiqlagan) {
      xabarlar.push(`${nom} — kelishini tasdiqladi: ${y.tasdiqlagan} / ${y.qoshilgan}`);
    }
  }
  return xabarlar;
}

// Ekrandagi jonli xabarlar: har biri bir necha soniyadan keyin o'zi yo'qoladi
export type JonliXabar = { id: number; matn: string };
const JONLI_XABAR_SONIYA = 4;
let jonli: JonliXabar[] = [];
let keyingiId = 1;
const jonliKuzatuvchilar = new Set<(x: JonliXabar[]) => void>();

function jonliYangila(yangi: JonliXabar[]) {
  jonli = yangi;
  jonliKuzatuvchilar.forEach((k) => k(jonli));
}

function jonliXabarQosh(matn: string) {
  const xabar = { id: keyingiId++, matn };
  jonliYangila([...jonli, xabar]);
  setTimeout(() => jonliYangila(jonli.filter((x) => x.id !== xabar.id)), JONLI_XABAR_SONIYA * 1000);
}

export function useJonliXabarlar(): JonliXabar[] {
  const [x, setX] = useState(jonli);
  useEffect(() => {
    jonliKuzatuvchilar.add(setX);
    return () => {
      jonliKuzatuvchilar.delete(setX);
    };
  }, []);
  return x;
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
