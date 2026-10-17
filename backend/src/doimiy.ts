import { Repository } from 'typeorm';
import { Oyin } from './oyin.entity.js';
import { kunQosh } from './sana.js';

// «Doimiy o'yin» (13-Modul 4-dars): keyingi haftaning o'yini GET /oyinlar so'ralganda yaratiladi —
// Backend uxlashi mumkin, shuning uchun vaqtga bog'langan ish (taymer) yo'q.
// Vaqti o'tgan (Toshkent vaqti) har doimiy o'yin uchun — bir haftadan keyingi kunga, xuddi shu soat, maydon, kerakli odamlar soni
// va tashkilotchi bilan yangi o'yin; doimiy belgisi yangisiga o'tadi, eskisida o'chadi — bitta o'yindan keyingisi bir marta yaratiladi.
// Yangi o'yin «0 / N» dan boshlanadi (qo'shilganlar ko'chirilmaydi).
// Pro muddati ichida (5-dars): tashkilotchining Pro'si tugagan bo'lsa — keyingi o'yin o'zi e'lon qilinmaydi, e'lon qilinganlar qoladi.
export async function keyingiDoimiylarniYarat(oyinlar: Repository<Oyin>): Promise<{ eski: Oyin; yangi: Oyin }[]> {
  const otganlar = await oyinlar
    .createQueryBuilder('o')
    .innerJoin('oyinchilar', 't', 't.id = o.tashkilotchi_id')
    .where('o.doimiy = true')
    .andWhere('t.pro_gacha > now()')
    .andWhere(`(o.kun + o.soat::time) < (now() AT TIME ZONE 'Asia/Tashkent')`)
    .getMany();

  const yaratilganlar: { eski: Oyin; yangi: Oyin }[] = [];
  for (const eski of otganlar) {
    const yangi = await oyinlar.manager.transaction(async (m) => {
      const jadval = m.getRepository(Oyin);
      const o = await jadval.save({
        kun: kunQosh(eski.kun, 7),
        soat: eski.soat,
        maydon: eski.maydon,
        kerak: eski.kerak,
        tashkilotchi_id: eski.tashkilotchi_id,
        doimiy: true,
      });
      await jadval.update({ id: eski.id }, { doimiy: false });
      return o;
    });
    yaratilganlar.push({ eski, yangi });
  }
  return yaratilganlar;
}
