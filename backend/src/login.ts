// Login (12-Modul 7-dars) — ro'yxatdan o'tishda o'zi tanlagan nom: 3–20 belgi, harf va raqam (lotin), kichik harfda saqlanadi
export const LOGIN_QOIDASI = /^[a-z0-9]{3,20}$/;

// Ismdan namuna login (migratsiya va namuna akkauntlar uchun): «Namuna o'yinchi 1» → namunaoyinchi1. Band bo'lsa — oxiriga 2, 3, …
export function ismdanLogin(ism: string, band: Set<string>): string {
  let asos = ism.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  if (asos.length < 3) asos = 'oyinchi';
  let login = asos;
  for (let n = 2; band.has(login); n++) login = asos.slice(0, 20 - String(n).length) + n;
  band.add(login);
  return login;
}
