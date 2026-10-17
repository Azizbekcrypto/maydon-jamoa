import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { hodisaYoz } from '@/hodisa';
import type { Oyin } from '@/oyin';
import { ochir, ol, saqla } from '@/saqlash';

// Rejalashtirilgan eslatmalar (expo-notifications) — ilova o'zi oldindan qo'yadi; ilova yopiq bo'lsa ham chiqadi.
//
// 1) O'yin eslatmasi (4-dars): «Qo'shilaman» muvaffaqiyatli bo'lganda — o'yindan bir soat oldin, «Maydon Jamoa» ·
//    «Bugun, 18:00 · Mahalla maydoni». Bir soatdan kam qolgan bo'lsa — qo'yilmaydi; «O'yindan chiqish» — bekor.
//    Bitta o'yinga bitta (identifier — oyin-{id}). O'yin eslatmasi har doim qo'yiladi — o'yinchi o'zi qo'shilgan.
// 2) Uch kunlik eslatma (9-dars): ilova har ochilganda oldingisi bekor, yangisi uch kundan keyin soat 17:00 ga —
//    «Hafta oxiriga o'yin bormi? E'lonlarni ko'ring». Ilovani uch kun ochmagan odamga chiqadi; faqat hisobga kirgan foydalanuvchiga.
//    Ilova yopiq paytda yangi e'lon bor-yo'qligini bilmaydi — shuning uchun matn da'vo qilmaydi, taklif qiladi.
//    Haftalik chegara: o'sha haftada (dushanbadan yakshanbagacha) ilovaning ikkita eslatmasi bo'lsa (o'yin eslatmasi ham
//    sanaladi) — uch kunlik qo'yilmaydi: hafta ikkitaga to'lsa, ilova o'zidan qo'shmaydi.
// Qo'yilgan eslatmalarning vaqti telefonda saqlanadi — haftalik hisob shundan.
// Eslatma bosilib ilova ochilsa (fonda ham, butunlay yopiq bo'lsa ham) — sanoq yozuvi eslatmadan-ochdi, bitta bosishga bitta.
// «Eslatmalar» o'chirgichi (9-dars): o'chirilsa — hammasi bekor va yangisi qo'yilmaydi; yoqilsa — hozirgi ma'lumotdan qaytadan.
// Brauzer ko'rinishida eslatma yo'q (expo-notifications web'da ishlamaydi) — ilova ishlayveradi.

export const ESLATMA_BOR = Platform.OS !== 'web';

const BIR_SOAT = 60 * 60 * 1000;
const KUN = 24 * BIR_SOAT;
const UCH_KUNLIK_SOAT = 17; // 17:00
const HAFTASIGA = 2;

const ROYXAT_KALITI = 'eslatmalar'; // [{ id, vaqt }] — qo'yilgan eslatmalar (o'tganlari ham, bir haftagacha)
const YOQIQ_KALITI = 'eslatmalar_yoqiq'; // '0' — o'chirilgan; sukutda yoqiq

type Yozuv = { id: string; vaqt: number };

if (ESLATMA_BOR) {
  // Ilova ochiq paytga to'g'ri kelsa ham eslatma ko'rinadi
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

async function yozuvlar(): Promise<Yozuv[]> {
  try {
    const royxat: Yozuv[] = JSON.parse((await ol(ROYXAT_KALITI)) ?? '[]');
    // Bir haftadan eski yozuvlar kerak emas
    return royxat.filter((y) => y.vaqt > Date.now() - 8 * KUN);
  } catch {
    return [];
  }
}

const yozuvlarniSaqla = (royxat: Yozuv[]) => saqla(ROYXAT_KALITI, JSON.stringify(royxat));

export async function eslatmalarYoqiqmi(): Promise<boolean> {
  return ESLATMA_BOR && (await ol(YOQIQ_KALITI)) !== '0';
}

// Telefon ruxsati (ilova o'chirgichidan alohida holat)
export async function ruxsatBormi(): Promise<boolean> {
  return ESLATMA_BOR && (await Notifications.getPermissionsAsync()).granted;
}

// Ruxsatni birinchi marta so'raydi (Android'da avval eslatma kanali yaratiladi — ruxsat oynasi shundan keyin chiqadi)
async function ruxsatSora(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Maydon Jamoa',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  if (await ruxsatBormi()) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function qoy(id: string, vaqt: number, body: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: 'Maydon Jamoa', body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(vaqt) },
  });
  await yozuvlarniSaqla([...(await yozuvlar()).filter((y) => y.id !== id), { id, vaqt }]);
}

async function bekor(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
  await yozuvlarniSaqla((await yozuvlar()).filter((y) => y.id !== id));
}

// O'yin boshlanish vaqti: kun va soat — Toshkent vaqti (UTC+5)
function oyinVaqti(o: Oyin): number {
  return new Date(`${o.kun}T${o.soat}:00+05:00`).getTime();
}

export async function oyinEslatmasiniQoy(o: Oyin) {
  if (!(await eslatmalarYoqiqmi())) return;
  const vaqt = oyinVaqti(o) - BIR_SOAT;
  if (vaqt <= Date.now()) return; // o'yinga bir soatdan kam qolgan
  if (!(await ruxsatSora())) return;
  await qoy(`oyin-${o.id}`, vaqt, `Bugun, ${o.soat} · ${o.maydon}`);
}

export async function oyinEslatmasiniBekor(oyinId: number) {
  if (ESLATMA_BOR) await bekor(`oyin-${oyinId}`);
}

// Hafta — dushanbadan yakshanbagacha (telefon vaqti bilan): shu vaqt tushgan haftaning boshi
function haftaBoshi(vaqt: number): number {
  const d = new Date(vaqt);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

// Uch kunlik eslatma: ilova ochilganda, o'yinga qo'shilgan yoki chiqqandan keyin qayta hisoblanadi
export async function uchKunlikniQoy() {
  if (!(await eslatmalarYoqiqmi())) return;
  const royxat = await yozuvlar();
  // Oldingi uch kunlik — hali chiqmagan bo'lsa bekor (chiqib bo'lgani haftalik hisobda qoladi)
  for (const y of royxat) if (y.id.startsWith('uchkunlik-') && y.vaqt > Date.now()) await bekor(y.id);

  const d = new Date(Date.now() + 3 * KUN);
  d.setHours(UCH_KUNLIK_SOAT, 0, 0, 0);
  const vaqt = d.getTime();

  const hafta = haftaBoshi(vaqt);
  const shuHaftada = (await yozuvlar()).filter((y) => haftaBoshi(y.vaqt) === hafta).length;
  if (shuHaftada >= HAFTASIGA) return; // hafta ikkitaga to'lgan — ilova o'zidan qo'shmaydi

  // Ruxsat bu yerda so'ralmaydi (ilova ochilishi bilan oyna chiqmasin) — 4-darsdagidek «Qo'shilaman»da so'raladi
  if (!(await ruxsatBormi())) return;
  await qoy(`uchkunlik-${vaqt}`, vaqt, "Hafta oxiriga o'yin bormi? E'lonlarni ko'ring");
}

// «Hisobdan chiqish», «Hisobni o'chirish» va o'chirgich o'chirilganda — shu telefondagi hamma eslatma bekor
export async function hammasiniBekor() {
  if (!ESLATMA_BOR) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await ochir(ROYXAT_KALITI);
}

// «Eslatmalar» o'chirgichi. Yoqilsa — hozirgi GET /oyinlar javobidan: o'zim qo'shilgan, hali boshlanmagan o'yinlar uchun
// o'yin eslatmasi (bir soatdan kam qolgan — yo'q, o'tgan o'yinga — yo'q) va uch kunlik eslatma.
export async function eslatmalarniYoq(yoqiq: boolean, oyinlar: Oyin[] | null) {
  await saqla(YOQIQ_KALITI, yoqiq ? '1' : '0');
  if (!yoqiq) {
    await hammasiniBekor();
    return;
  }
  for (const o of oyinlar ?? []) if (o.menQoshilganman) await oyinEslatmasiniQoy(o);
  await uchKunlikniQoy();
}

// Eslatma bosilib ilova ochildi → hodisaYoz('eslatmadan-ochdi'). Bitta bosishga bitta yozuv: javob (eslatma identifier va
// vaqti) eslab qolinadi va oxirgi javob tozalanadi — ilova qayta ochilganda o'sha bosish yana sanalmaydi.
const sanalgan = new Set<string>();

function eslatmaBosildi(javob: Notifications.NotificationResponse | null) {
  if (!javob || javob.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const kalit = `${javob.notification.request.identifier}:${javob.notification.date}`;
  if (sanalgan.has(kalit)) return;
  sanalgan.add(kalit);
  hodisaYoz('eslatmadan-ochdi');
  Notifications.clearLastNotificationResponseAsync().catch(() => {});
}

// Ilova ochiladigan joyda (_layout.tsx) bir marta: butunlay yopiq ilova eslatmadan ochilgan bo'lsa — oxirgi javob,
// ilova ochiq yoki fonda bo'lsa — tinglovchi
export function eslatmaBosilishiniSana(): () => void {
  if (!ESLATMA_BOR) return () => {};
  Notifications.getLastNotificationResponseAsync().then(eslatmaBosildi).catch(() => {});
  const obuna = Notifications.addNotificationResponseReceivedListener(eslatmaBosildi);
  return () => obuna.remove();
}
