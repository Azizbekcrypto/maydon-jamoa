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
};

// Oxirgi GET /oyinlar javobi — ilovada bitta: «O'yinlar» va «O'yin» shu javobdan o'qiydi.
// Bitta so'rov ochiq turgan ikkala ekranni birga yangilaydi.
let oxirgi: Oyin[] | null = null;
const kuzatuvchilar = new Set<(o: Oyin[]) => void>();

export const oxirgiRoyxat = () => oxirgi;

export async function oyinlarniOl(): Promise<Oyin[]> {
  const royxat = await sora<Oyin[]>('/oyinlar');
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
