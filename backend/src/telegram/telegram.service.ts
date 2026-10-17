import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

// Telegram Bot API (13-Modul 8-dars). Bot tokeni — TELEGRAM_BOT_TOKEN, webhook maxfiy kaliti — TELEGRAM_SIR (backend/.env va Render).
// Token so'rov manzilida turadi — shuning uchun xato logga manzilsiz, faqat metod nomi va Telegram javobi bilan yoziladi.
@Injectable()
export class TelegramXizmati implements OnApplicationBootstrap {
  private readonly log = new Logger('Telegram');
  private botNomiXotira: string | null = null;
  // Bitta chatga sekundiga bittadan ko'p xabar yuborilmaydi — har chatning oxirgi yuborilgan vaqti
  private readonly oxirgiYuborish = new Map<string, number>();

  private get token() {
    return process.env.TELEGRAM_BOT_TOKEN ?? '';
  }

  private async api<T>(metod: string, tana?: Record<string, unknown>): Promise<T> {
    if (!this.token) throw new Error("TELEGRAM_BOT_TOKEN yo'q");
    const javob = await fetch(`https://api.telegram.org/bot${this.token}/${metod}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tana ?? {}),
    });
    const j = (await javob.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
    if (!j.ok) throw new Error(`${metod}: ${j.description ?? javob.status}`);
    return j.result as T;
  }

  // Backend Render'da ishga tushganda (ochiq manzil — RENDER_EXTERNAL_URL) webhook o'rnatiladi; laptopda — o'rnatilmaydi.
  // Xato bo'lsa Backend ishlashda davom etadi.
  async onApplicationBootstrap() {
    const manzil = process.env.RENDER_EXTERNAL_URL;
    if (!this.token || !manzil) return;
    try {
      await this.api('setWebhook', {
        url: `${manzil.replace(/\/+$/, '')}/telegram/webhook`,
        secret_token: process.env.TELEGRAM_SIR ?? '',
        allowed_updates: ['message'],
      });
      this.log.log("Webhook o'rnatildi");
      await this.botNomi();
    } catch (e) {
      this.log.error(`Webhook o'rnatilmadi — ${(e as Error).message}`);
    }
  }

  // Botning foydalanuvchi nomi — getMe (yangi .env o'zgaruvchisi kerak emas); bilinmasa — null
  async botNomi(): Promise<string | null> {
    if (this.botNomiXotira) return this.botNomiXotira;
    try {
      const men = await this.api<{ username?: string }>('getMe');
      this.botNomiXotira = men.username ?? null;
    } catch (e) {
      this.log.error((e as Error).message);
    }
    return this.botNomiXotira;
  }

  // Telegram so'rovidagi maxfiy kalit (X-Telegram-Bot-Api-Secret-Token) TELEGRAM_SIR ga tengmi; kalit bo'sh bo'lsa — hech qachon
  sirTogrimi(sir: unknown): boolean {
    const asl = process.env.TELEGRAM_SIR;
    if (!asl || typeof sir !== 'string' || !sir) return false;
    const a = Buffer.from(sir);
    const b = Buffer.from(asl);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  // Xabar yuborish. true — Telegram qabul qildi; false — qabul qilmadi (masalan, o'yinchi botni to'xtatgan) — xato logga.
  async yubor(chatId: string, matn: string): Promise<boolean> {
    const oldingi = this.oxirgiYuborish.get(chatId) ?? 0;
    const kutish = oldingi + 1100 - Date.now();
    if (kutish > 0) await new Promise((r) => setTimeout(r, kutish));
    this.oxirgiYuborish.set(chatId, Date.now());
    try {
      await this.api('sendMessage', { chat_id: chatId, text: matn });
      return true;
    } catch (e) {
      this.log.error(`Xabar yuborilmadi — ${(e as Error).message}`);
      return false;
    }
  }
}
