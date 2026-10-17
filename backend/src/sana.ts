// Sana yordamchilari. «bugun» — Toshkent vaqti bilan. kun — '2026-10-10' ko'rinishidagi satr.

export function bugunToshkent(hozir = new Date()): string {
  // en-CA formati: 2026-10-10
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(hozir);
}

export function kunQosh(kun: string, n: number): string {
  const d = new Date(`${kun}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Bugundan keyingi eng yaqin shanba (bugun shanba bo'lsa — bugun) va undan keyingi yakshanba
export function keyingiShanbaYakshanba(hozir = new Date()): { shanba: string; yakshanba: string } {
  const bugun = bugunToshkent(hozir);
  const haftaKuni = new Date(`${bugun}T00:00:00Z`).getUTCDay(); // 0 — yakshanba, 6 — shanba
  const shanba = kunQosh(bugun, (6 - haftaKuni + 7) % 7);
  return { shanba, yakshanba: kunQosh(shanba, 1) };
}

// '2026-10-17' → «Shanba» (Telegram xabari matni, 13-Modul 8-dars)
const KUN_NOMLARI = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
export function kunNomi(kun: string): string {
  return KUN_NOMLARI[new Date(`${kun}T00:00:00Z`).getUTCDay()] ?? kun;
}

// '2026-10-11' — haqiqiy sanami
export function sanaTogrimi(kun: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(kun)) return false;
  const d = new Date(`${kun}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === kun;
}
