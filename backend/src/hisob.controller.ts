import { Controller, Delete, HttpCode, Req, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Ishtirokchi } from './ishtirokchi.entity.js';
import { Oyin } from './oyin.entity.js';
import { Oyinchi } from './oyinchi.entity.js';
import { QOSHILGAN } from './oyinlar.controller.js';
import { OyinlarGateway } from './oyinlar.gateway.js';
import { TokenGuard, type Sorov } from './token.guard.js';

@Controller('hisob')
@UseGuards(TokenGuard)
export class HisobController {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly ulanishlar: OyinlarGateway,
  ) {}

  // DELETE /hisob — «Hisobni o'chirish» (ilova avval «Rostdan o'chirasizmi?» deb so'raydi). Faqat token egasining o'zi.
  // O'chadi: shu akkaunt (oyinchilar, WHERE id = …) va uning qatnashuv yozuvlari (ishtirokchilar, WHERE oyinchi_id = …);
  // 13-Modul: Telegram chat raqami va telegram_xabarlar yozuvlari, mashq to'lov yozuvlari (tolovlar, boshlangan_tolovlar — bog'lovchi ustun bilan).
  // O'chmaydi: u e'lon qilgan o'yinlar — tashkilotchisi bo'sh qoladi (oyinlar.tashkilotchi_id = null).
  // U qo'shilgan o'yinlarda son o'yindan chiqqandagi kabi yangilanadi: navbatdagi birinchisi qoshildi bo'ladi, oyin-ozgardi · chiqdi.
  @Delete()
  @HttpCode(200)
  async ochir(@Req() sorov: Sorov) {
    const men = sorov.oyinchiId!;
    const ozgargan = await this.db.transaction(async (m) => {
      const jadval = m.getRepository(Ishtirokchi);
      const qatorlar = await jadval.find({ where: { oyinchi_id: men }, order: { oyin_id: 'ASC' } });
      for (const q of qatorlar) {
        // O'yin qatori qulflanadi — chiqish va qo'shilish bilan bir xil «bitta ish»
        await m.getRepository(Oyin).findOne({ where: { id: q.oyin_id }, lock: { mode: 'pessimistic_write' } });
        if (QOSHILGAN.includes(q.holat)) {
          const navbatdagi = await jadval.findOne({
            where: { oyin_id: q.oyin_id, holat: 'navbatda' },
            order: { yaratilgan: 'ASC' },
          });
          if (navbatdagi) {
            await jadval.update({ oyin_id: q.oyin_id, oyinchi_id: navbatdagi.oyinchi_id }, { holat: 'qoshildi' });
          }
        }
      }
      await m.query(`DELETE FROM ishtirokchilar WHERE oyinchi_id = $1`, [men]);
      // Telegram (13-Modul 8-dars): qaysi o'yin haqida xabar yuborilgani; chat raqami akkaunt bilan birga o'chadi
      await m.query(`DELETE FROM telegram_xabarlar WHERE oyinchi_id = $1`, [men]);
      await m.query(`DELETE FROM oyinchilar WHERE id = $1`, [men]);
      return qatorlar.filter((q) => q.holat !== 'chiqdi').map((q) => q.oyin_id);
    });
    // Tranzaksiya tugagach — o'zgargan o'yinlar uchun hodisa
    for (const oyinId of ozgargan) this.ulanishlar.oyinOzgardi(oyinId, 'chiqdi');
    return { ochirildi: true };
  }
}
