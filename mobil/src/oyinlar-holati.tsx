import { createContext, useContext, useState, type ReactNode } from 'react';

import { namunaOyinlar, type Oyin } from '@/namuna';

// Uch ekran bitta ro'yxatni ko'radi: O'yinlar, O'yin va E'lon berish.
type Holat = {
  oyinlar: Oyin[];
  qoshildim: string[];
  qoshil: (id: string) => void;
  elonBer: (yangi: Omit<Oyin, 'id' | 'qoshilgan'>) => void;
};

const OyinlarCtx = createContext<Holat | null>(null);

export function OyinlarHolati({ children }: { children: ReactNode }) {
  const [oyinlar, setOyinlar] = useState(namunaOyinlar);
  const [qoshildim, setQoshildim] = useState<string[]>([]);

  function qoshil(id: string) {
    setOyinlar((r) => r.map((o) => (o.id === id ? { ...o, qoshilgan: o.qoshilgan + 1 } : o)));
    setQoshildim((r) => [...r, id]);
  }

  function elonBer(yangi: Omit<Oyin, 'id' | 'qoshilgan'>) {
    setOyinlar((r) => [...r, { ...yangi, id: String(r.length + 1), qoshilgan: 0 }]);
  }

  return (
    <OyinlarCtx.Provider value={{ oyinlar, qoshildim, qoshil, elonBer }}>{children}</OyinlarCtx.Provider>
  );
}

export function useOyinlar(): Holat {
  const holat = useContext(OyinlarCtx);
  if (!holat) throw new Error('OyinlarHolati ichida ishlating');
  return holat;
}
