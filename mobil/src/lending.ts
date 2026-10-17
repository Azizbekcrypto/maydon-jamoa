// Lending manzili (12-Modul 1-dars, Netlify) — ochiq qiymat, maxfiy emas.
// NAMUNA: o'z lendingingiz manziliga almashtiring (oxirida / siz).
export const LENDING = 'https://maydon-jamoa-namuna.netlify.app';

// Maxfiylik siyosati — lendingdagi sahifa (7-dars)
export const MAXFIYLIK = `${LENDING}/maxfiylik.html`;

// Pro shartlari (oferta, 13-Modul 7-dars) — lendingdagi sahifa; to'lov taklifi ekranida, to'lashdan oldin ko'rinadi
export const OFERTA = `${LENDING}/oferta.html`;

// «Havolani ulashish» (10-dars, Mentor zaxira rejasidagi ish): tashkilotchi o'z jamoasiga lending havolasini yuboradi —
// oxirida kanal belgisi ?kanal=ilova (6-dars mexanizmi: Umami'da kanal bo'yicha ko'rinadi — gipoteza shu bilan tekshiriladi)
export const ULASHISH_HAVOLASI = `${LENDING}/?kanal=ilova`;

// 13-Modul 10-dars: «Havolani ulashish» endi shaxsiy havolani ulashadi — har hisobning o'z taklif kodi bilan
// (kim ulashgani bilinadi); kanal belgisi — taklif. Lending kodni ko'rsatadi, ro'yxatdan o'tishda kod qo'lda yoziladi.
export const taklifHavolasi = (taklifKodi: string) => `${LENDING}/?taklif=${taklifKodi}&kanal=taklif`;
