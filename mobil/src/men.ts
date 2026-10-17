import { useEffect, useState } from 'react';

import { sora } from '@/api';

// GET /men — kirgan o'yinchining o'z holati (13-Modul 4-dars): Pro bormi va qachongacha.
// Pro'ni ilova o'zi hisoblamaydi — Backend aytadi (muddat tugasa pro: false).
export type Men = {
  pro: boolean;
  proGacha: string | null;
};

// Oxirgi javob — ilovada bitta: «E'lon berish» va to'lov taklifi ekrani shundan o'qiydi (oyin.ts dagidek)
let oxirgi: Men | null = null;
const kuzatuvchilar = new Set<(m: Men) => void>();

export async function menniOl(): Promise<Men> {
  const men = await sora<Men>('/men');
  oxirgi = men;
  kuzatuvchilar.forEach((k) => k(men));
  return men;
}

export function useMen(): Men | null {
  const [men, setMen] = useState(oxirgi);
  useEffect(() => {
    kuzatuvchilar.add(setMen);
    return () => {
      kuzatuvchilar.delete(setMen);
    };
  }, []);
  return men;
}

// «Hisobdan chiqish»da — eski hisobning Pro holati keyingi hisobga o'tmasin
export function menniUnut() {
  oxirgi = null;
}
