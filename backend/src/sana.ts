// Sana yordamchilari. «bugun» — Toshkent vaqti bilan. kun — '2026-10-10' ko'rinishidagi satr.

export function bugunToshkent(hozir = new Date()): string {
  // en-CA formati: 2026-10-10
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(hozir);
}

function kunQosh(kun: string, n: number): string {
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
