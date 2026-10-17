import { useEffect, useState } from 'react';

import { sora } from '@/api';

// GET /oyinlar javobidagi bitta o'yin. «O'yin» ekrani ham shu ro'yxatdan o'qiydi (alohida yo'l yo'q).
export type Oyin = {
  id: number;
  kun: string;
  soat: string;
  maydon: string;
  kerak: number;
  // qoshildi yoki keladi bo'lganlar — «8 / 10» dagi 8
  qoshilgan: number;
  menQoshilganman: boolean;
  // kelishini tasdiqlaganlar (keladi) soni — faqat tashkilotchiga keladi, boshqalarga null
  tasdiqlagan: number | null;
  // kirgan o'yinchi kelishini tasdiqlaganmi va hozir «Kelaman» bosa oladimi (qoidani Backend hisoblaydi)
  menTasdiqlaganman: boolean;
  menTasdiqlayOlaman: boolean;
  // navbatdagilar soni va kirgan o'yinchi navbatdami
  navbatda: number;
  menNavbatdaman: boolean;
  // o'yinni kirgan o'yinchi e'lon qilganmi (tashkilotchi)
  menTashkilotchiman: boolean;
};

// Oxirgi GET /oyinlar javobi — ilovada bitta: «O'yinlar» va «O'yin» shu javobdan o'qiydi.
// Bitta so'rov ochiq turgan ikkala ekranni birga yangilaydi.
let oxirgi: Oyin[] | null = null;
const kuzatuvchilar = new Set<(o: Oyin[]) => void>();

export const oxirgiRoyxat = () => oxirgi;

// Mehmon ko'rinishi (kirmagan odam, 12-Modul 8-dars): Backend faqat id, kun, soat, maydon, kerak, qoshilgan beradi —
// qolgan maydonlar «yo'q» qiymati bilan to'ldiriladi (ekranlar bitta turdan o'qiydi).
const MEHMON_UCHUN: Omit<Oyin, 'id' | 'kun' | 'soat' | 'maydon' | 'kerak' | 'qoshilgan'> = {
  menQoshilganman: false,
  tasdiqlagan: null,
  menTasdiqlaganman: false,
  menTasdiqlayOlaman: false,
  navbatda: 0,
  menNavbatdaman: false,
  menTashkilotchiman: false,
};

export async function oyinlarniOl(): Promise<Oyin[]> {
  const royxat = (await sora<Partial<Oyin>[]>('/oyinlar')).map((o) => ({ ...MEHMON_UCHUN, ...o }) as Oyin);
  oxirgi = royxat;
  kuzatuvchilar.forEach((k) => k(royxat));
  return royxat;
}

// Ekran uchun: oxirgi javob va har yangi javob (ekran yopilganda kuzatuvchi olib tashlanadi — ko'payib ketmaydi)
export function useOyinlar(): Oyin[] | null {
  const [royxat, setRoyxat] = useState(oxirgi);
  useEffect(() => {
    kuzatuvchilar.add(setRoyxat);
    return () => {
      kuzatuvchilar.delete(setRoyxat);
    };
  }, []);
  return royxat;
}
