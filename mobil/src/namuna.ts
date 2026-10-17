// Namuna ma'lumot — prototip/src/namuna.js dagidek (4 ta o'yin, har biriga id).
// Backend va Database yo'q: «Qo'shilaman» va yangi e'lon faqat ilova ochiq turganda turadi.
export type Oyin = {
  id: string;
  kun: string;
  soat: string;
  maydon: string;
  qoshilgan: number;
  kerak: number;
};

export const namunaOyinlar: Oyin[] = [
  { id: '1', kun: 'Shanba', soat: '18:00', maydon: 'Mahalla maydoni', qoshilgan: 8, kerak: 10 },
  { id: '2', kun: 'Shanba', soat: '20:00', maydon: 'Maktab maydoni', qoshilgan: 6, kerak: 10 },
  { id: '3', kun: 'Yakshanba', soat: '10:00', maydon: 'Park maydoni', qoshilgan: 4, kerak: 8 },
  { id: '4', kun: 'Yakshanba', soat: '17:00', maydon: 'Mahalla maydoni', qoshilgan: 9, kerak: 10 },
];
