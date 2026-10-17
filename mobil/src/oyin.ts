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
};

export const oyinlarniOl = () => sora<Oyin[]>('/oyinlar');
