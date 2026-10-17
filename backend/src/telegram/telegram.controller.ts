import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';
import { TokenGuard, type Sorov } from '../token.guard.js';
import { TelegramXizmati } from './telegram.service.js';

// Bot javoblari (13-Modul 8-dars)
const ULANDI = "Ulandi. Siz qatnashgan «Doimiy o'yin» yana e'lon qilinsa, shu yerga yozaman. O'chirish — ilovada.";
const ESKIRGAN = "Havola eskirgan. Ilovada «Telegram'da xabar olish»ni qayta bosing.";
const BOSHQA = "Bu bot ilovadan ulanadi: ilovada «Telegram'da xabar olish»ni bosing.";

const KOD_BELGILARI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const KOD_DAQIQA = 10;

// Bir martalik kod: 16 belgi, faqat harf va raqam, crypto bilan tasodifiy (Math.random emas)
function yangiKod(): string {
  return Array.from(randomBytes(16), (b) => KOD_BELGILARI[b % KOD_BELGILARI.length]).join('');
}

type TelegramYangilanishi = {
  update_id?: number;
  message?: { chat?: { id?: number; type?: string }; text?: string };
};

@Controller('telegram')
export class TelegramController {
  constructor(
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly telegram: TelegramXizmati,
  ) {}

  // POST /telegram/kod (token bilan) — «Telegram'da xabar olish»: yangi bir martalik kod (10 daqiqa; logga yozilmaydi)
  // → { havola: 'https://t.me/<bot>?start=<kod>' }. Bot sozlanmagan bo'lsa — 503.
  @Post('kod')
  @UseGuards(TokenGuard)
  async kod(@Req() sorov: Sorov) {
    const bot = await this.telegram.botNomi();
    if (!bot) throw new ServiceUnavailableException('Telegram bot sozlanmagan');
    const kod = yangiKod();
    await this.oyinchilar.update(
      { id: sorov.oyinchiId! },
      { telegram_kod: kod, telegram_kod_gacha: new Date(Date.now() + KOD_DAQIQA * 60_000) },
    );
    return { havola: `https://t.me/${bot}?start=${kod}` };
  }

  // DELETE /telegram (token bilan) — «Telegram xabarlarini o'chirish» (8-dars): faqat o'z yozuvi — chat raqami va kutayotgan
  // bir martalik kod o'chadi, xabar to'xtaydi. Qaysi o'yin haqida xabar yuborilgani (telegram_xabarlar) hisob o'chirilguncha qoladi.
  @Delete()
  @HttpCode(200)
  @UseGuards(TokenGuard)
  async ochir(@Req() sorov: Sorov) {
    await this.oyinchilar.update(
      { id: sorov.oyinchiId! },
      { telegram_chat_id: null, telegram_kod: null, telegram_kod_gacha: null },
    );
    return { telegram: false };
  }

  // POST /telegram/webhook — Telegram yuboradi. Sarlavha X-Telegram-Bot-Api-Secret-Token ≠ TELEGRAM_SIR — 401, hech narsa qilinmaydi.
  // Faqat shaxsiy chatdagi «/start <kod>»: kod topilsa va muddati o'tmagan bo'lsa — chat raqami yoziladi, kod o'chiriladi
  // (bitta Database ishida, o'yinchi qatori qulflanadi: bir vaqtdagi ikki so'rovdan bittasi ulaydi). Telegram so'rovidan faqat chat raqami
  // olinadi — ism, Telegram nomi va xabar matni saqlanmaydi va logga yozilmaydi. Telegram'ga javob — 200 (401 dan tashqari);
  // bir xil update_id ikkinchi marta kelsa — qayta ishlanmaydi.
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Headers('x-telegram-bot-api-secret-token') sir: string | undefined, @Body() yangilanish: TelegramYangilanishi) {
    if (!this.telegram.sirTogrimi(sir)) throw new UnauthorizedException();

    const updateId = yangilanish?.update_id;
    if (!Number.isInteger(updateId)) return {};
    const yangi: unknown[] = await this.db.query(
      `INSERT INTO telegram_yangilanishlar (update_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING update_id`,
      [updateId],
    );
    if (!yangi.length) return {};

    const xabar = yangilanish.message;
    const chatId = xabar?.chat?.id;
    if (xabar?.chat?.type !== 'private' || !Number.isInteger(chatId)) return {};
    const chat = String(chatId);

    const start = /^\/start(?:@\w+)?(?:\s+(\S+))?\s*$/.exec(typeof xabar.text === 'string' ? xabar.text.trim() : '');
    if (!start) {
      await this.telegram.yubor(chat, BOSHQA);
      return {};
    }
    const kod = start[1];
    const ulandi =
      !!kod &&
      (await this.db.transaction(async (m) => {
        const [oyinchi]: { id: number }[] = await m.query(
          `SELECT id FROM oyinchilar WHERE telegram_kod = $1 AND telegram_kod_gacha > now() FOR UPDATE`,
          [kod],
        );
        if (!oyinchi) return false;
        await m.query(
          `UPDATE oyinchilar SET telegram_chat_id = $1, telegram_kod = NULL, telegram_kod_gacha = NULL WHERE id = $2`,
          [chat, oyinchi.id],
        );
        return true;
      }));
    await this.telegram.yubor(chat, kod ? (ulandi ? ULANDI : ESKIRGAN) : BOSHQA);
    return {};
  }
}
