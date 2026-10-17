import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ismdanLogin } from './login.js';

// 12-Modul 7-dars: ro'yxatdan o'tishda telefon raqami so'ralmaydi — oyinchilar.telefon o'rniga login.
// Bir martalik o'tkazish (jadvallar entity'lardan yangilanishidan oldin ishlaydi; telefon ustuni yo'q bo'lsa — hech narsa qilmaydi):
// mavjud akkauntlar o'chmaydi — har biriga ismidan namuna login (kichik harf, faqat harf va raqam; takrorlansa oxiriga raqam),
// hammasi namuna = true (shu kungacha bo'lganlar — namuna va tekshiruv akkauntlari), yaratilgan — o'tkazish vaqti;
// telefon ustuni qiymatlari bilan olib tashlanadi, parollar o'zgarmaydi. Berilgan loginlar ro'yxati logga yoziladi.
// (Mentor misolida agent avval shu ro'yxatni ko'rsatgan, «Davom et» dan keyin bajargan.)

const log = new Logger('Migratsiya');

export async function telefondanLoginga(url: string | undefined) {
  const ds = await new DataSource({ type: 'postgres', url }).initialize();
  try {
    const [telefon] = await ds.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'oyinchilar' AND column_name = 'telefon'`,
    );
    if (!telefon) return;

    await ds.transaction(async (m) => {
      await m.query(`ALTER TABLE oyinchilar ADD COLUMN IF NOT EXISTS login varchar(20)`);
      await m.query(`ALTER TABLE oyinchilar ADD COLUMN IF NOT EXISTS namuna boolean NOT NULL DEFAULT true`);
      await m.query(`ALTER TABLE oyinchilar ADD COLUMN IF NOT EXISTS yaratilgan timestamptz NOT NULL DEFAULT now()`);
      const oyinchilar: { id: number; ism: string }[] = await m.query(`SELECT id, ism FROM oyinchilar ORDER BY id`);
      const band = new Set<string>();
      for (const o of oyinchilar) {
        const login = ismdanLogin(o.ism, band);
        await m.query(`UPDATE oyinchilar SET login = $1, namuna = true WHERE id = $2`, [login, o.id]);
        log.log(`${o.id} · ${o.ism} → ${login}`);
      }
      await m.query(`ALTER TABLE oyinchilar DROP COLUMN telefon`);
    });
    log.log("telefon ustuni olib tashlandi; mavjud akkauntlar — namuna = true");
  } finally {
    await ds.destroy();
  }
}
