import { Repository } from 'typeorm';
import { Oyin } from './oyin.entity.js';
import { kunQosh } from './sana.js';

// «Doimiy o'yin» (13-Modul 4-dars): keyingi haftaning o'yini GET /oyinlar so'ralganda yaratiladi —
// Backend uxlashi mumkin, shuning uchun vaqtga bog'langan ish (taymer) yo'q.
// Vaqti o'tgan (Toshkent vaqti) har doimiy o'yin uchun — bir haftadan keyingi kunga, xuddi shu soat, maydon, kerakli odamlar soni
// va tashkilotchi bilan yangi o'yin; doimiy belgisi yangisiga o'tadi, eskisida o'chadi — bitta o'yindan keyingisi bir marta yaratiladi.
// Yangi o'yin «0 / N» dan boshlanadi (qo'shilganlar ko'chirilmaydi).
export async function keyingiDoimiylarniYarat(oyinlar: Repository<Oyin>): Promise<Oyin[]> {
  const otganlar = await oyinlar
    .createQueryBuilder('o')
    .where('o.doimiy = true')
    .andWhere('o.tashkilotchi_id IS NOT NULL')
    .andWhere(`(o.kun + o.soat::time) < (now() AT TIME ZONE 'Asia/Tashkent')`)
    .getMany();

  const yaratilganlar: Oyin[] = [];
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
    yaratilganlar.push(yangi);
  }
  return yaratilganlar;
}
