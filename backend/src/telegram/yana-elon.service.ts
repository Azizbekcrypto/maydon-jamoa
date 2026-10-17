import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Oyin } from '../oyin.entity.js';
import { kunNomi } from '../sana.js';
import { ILOVA_MANZILI } from './manzil.js';
import { TelegramXizmati } from './telegram.service.js';

const HAFTALIK_CHEGARA = 2;

// «… o'yini yana e'lon qilindi» (13-Modul 8-dars): «Doimiy o'yin»ning keyingi haftadagi o'yini yaratilganda —
// o'tgan haftadagi o'yinida qatnashgan (qoshildi yoki keladi) va Telegram'ni ulagan o'yinchilarga bitta Telegram xabari.
// Matnda faqat o'zgarish (kun, soat, joy) — tez o'zgaradigan son yozilmaydi; bosim va to'lov taklifi yo'q.
// Tartib: avval chegara sanaladi va telegram_xabarlar ga yozuv qo'shiladi — bitta Database ishida (o'yinchi qatori qulflanadi:
// bir vaqtdagi ikki so'rov ham chegaradan oshirmaydi, bitta o'yin haqida ikki marta yubormaydi); faqat yozuv qo'shilgan bo'lsa — xabar.
// Telegram qabul qilmasa (masalan, botni to'xtatgan) — o'sha yozuv o'chiriladi, chat raqamiga tegilmaydi, keyingisiga o'tiladi.
@Injectable()
export class YanaElonXabari {
  private readonly log = new Logger('Telegram');

  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly telegram: TelegramXizmati,
  ) {}

  async yubor(eskiOyinId: number, yangi: Oyin): Promise<void> {
    const qatnashchilar: { id: number; telegram_chat_id: string }[] = await this.db.query(
      `SELECT o.id, o.telegram_chat_id FROM ishtirokchilar i JOIN oyinchilar o ON o.id = i.oyinchi_id
       WHERE i.oyin_id = $1 AND i.holat IN ('qoshildi', 'keladi') AND o.telegram_chat_id IS NOT NULL`,
      [eskiOyinId],
    );
    const matn = `${kunNomi(yangi.kun)}, ${yangi.soat} o'yini yana e'lon qilindi · ${yangi.maydon}\n${ILOVA_MANZILI}/?kanal=telegram`;

    for (const q of qatnashchilar) {
      try {
        const yozuvId = await this.db.transaction(async (m) => {
          await m.query(`SELECT id FROM oyinchilar WHERE id = $1 FOR UPDATE`, [q.id]);
          const [{ soni }]: { soni: number }[] = await m.query(
            `SELECT COUNT(*)::int AS soni FROM telegram_xabarlar WHERE oyinchi_id = $1
             AND yuborilgan >= (date_trunc('week', now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent')`,
            [q.id],
          );
          if (soni >= HAFTALIK_CHEGARA) return null;
          const qator: { id: number }[] = await m.query(
            `INSERT INTO telegram_xabarlar (oyinchi_id, oyin_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`,
            [q.id, yangi.id],
          );
          return qator[0]?.id ?? null;
        });
        if (yozuvId === null) continue;
        if (!(await this.telegram.yubor(q.telegram_chat_id, matn))) {
          await this.db.query(`DELETE FROM telegram_xabarlar WHERE id = $1`, [yozuvId]);
        }
      } catch (e) {
        this.log.error(`Telegram xabari: ${(e as Error).message}`);
      }
    }
  }
}
