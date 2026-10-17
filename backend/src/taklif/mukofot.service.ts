import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const HAFTALIK_CHEKLOV = 2;
const MUKOFOT_KUN = 7;

// Taklif mukofoti (13-Modul 10-dars): taklif qilgan hisobga Pro'ning bepul haftasi (pro_gacha + 7 kun; pul ham, chegirma ham emas).
// Qachon: taklif kodi bilan ochilgan hisob birinchi marta asosiy harakatni qilganda (o'yinga qo'shilsa yoki o'yin e'lon qilsa) —
// harakat saqlangandan keyin, alohida Database ishida, bir marta. Uch shart: 1) ikkala hisob ham namuna emas;
// 2) yangi hisob ishlatilgan qurilma ID si taklif qilganning qurilmalari ichida yo'q (taklif qilganniki hali yozilmagan — mukofot yo'q);
// 3) taklif qilgan shu hafta (dushanba–yakshanba, Toshkent vaqti) 2 tadan kam mukofot olgan — sanashda uning qatori qulflanadi (FOR UPDATE).
// Tekshiruvda xato bo'lsa — qo'shilish va e'lon buzilmaydi: xato logga, yozuv qo'shilmaydi, keyingi harakatda yana tekshiriladi.
@Injectable()
export class TaklifMukofoti {
  private readonly log = new Logger('Taklif');

  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async tekshir(oyinchiId: number): Promise<void> {
    try {
      await this.db.transaction(async (m) => {
        const [yangi]: { id: number; namuna: boolean; taklif_qilgan_id: number | null }[] = await m.query(
          `SELECT id, namuna, taklif_qilgan_id FROM oyinchilar WHERE id = $1`,
          [oyinchiId],
        );
        if (!yangi?.taklif_qilgan_id) return;
        const [taklifQilgan]: { id: number; namuna: boolean }[] = await m.query(
          `SELECT id, namuna FROM oyinchilar WHERE id = $1 FOR UPDATE`,
          [yangi.taklif_qilgan_id],
        );
        if (!taklifQilgan) return;
        const [bor] = await m.query(`SELECT 1 FROM taklif_natijalari WHERE taklif_qilingan_id = $1`, [yangi.id]);
        if (bor) return;

        let natija: string;
        if (yangi.namuna || taklifQilgan.namuna) {
          natija = 'namuna';
        } else {
          const [{ soni: uningQurilmalari }]: { soni: number }[] = await m.query(
            `SELECT COUNT(*)::int AS soni FROM oyinchi_qurilmalari WHERE oyinchi_id = $1`,
            [taklifQilgan.id],
          );
          const [{ soni: yangiQurilmalari }]: { soni: number }[] = await m.query(
            `SELECT COUNT(*)::int AS soni FROM oyinchi_qurilmalari WHERE oyinchi_id = $1`,
            [yangi.id],
          );
          const [{ soni: umumiy }]: { soni: number }[] = await m.query(
            `SELECT COUNT(*)::int AS soni FROM oyinchi_qurilmalari a JOIN oyinchi_qurilmalari b ON b.qurilma_id = a.qurilma_id
             WHERE a.oyinchi_id = $1 AND b.oyinchi_id = $2`,
            [yangi.id, taklifQilgan.id],
          );
          const [{ soni: haftada }]: { soni: number }[] = await m.query(
            `SELECT COUNT(*)::int AS soni FROM taklif_natijalari WHERE taklif_qilgan_id = $1 AND natija = 'berildi'
             AND yaratilgan >= (date_trunc('week', now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent')`,
            [taklifQilgan.id],
          );
          if (!uningQurilmalari || !yangiQurilmalari) natija = 'nomalum';
          else if (umumiy) natija = 'bir-qurilma';
          else if (haftada >= HAFTALIK_CHEKLOV) natija = 'cheklov';
          else natija = 'berildi';
        }

        await m.query(
          `INSERT INTO taklif_natijalari (taklif_qilgan_id, taklif_qilingan_id, natija) VALUES ($1, $2, $3)`,
          [taklifQilgan.id, yangi.id, natija],
        );
        if (natija === 'berildi') {
          await m.query(
            `UPDATE oyinchilar SET pro_gacha = GREATEST(COALESCE(pro_gacha, now()), now()) + make_interval(days => $2) WHERE id = $1`,
            [taklifQilgan.id, MUKOFOT_KUN],
          );
        }
        this.log.log(`Taklif natijasi: ${natija}`);
      });
    } catch (e) {
      this.log.error(`Taklif mukofoti tekshirilmadi: ${(e as Error).message}`);
    }
  }
}
