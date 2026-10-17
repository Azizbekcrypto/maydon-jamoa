import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';
import { imzoTogrimi } from './imzo.js';
import { Tolov } from './tolov.entity.js';

const HOLATLAR = ['tolandi', 'rad'];

@Controller('tolov')
export class TolovController {
  constructor(
    @InjectRepository(Tolov) private readonly tolovlar: Repository<Tolov>,
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
  ) {}

  // POST /tolov/webhook — to'lov xabari (webhook): to'lov xizmati (mashqda — «Mashq to'lov» sahifasi) yuboradi.
  // Tana { tolovRaqami, holat: 'tolandi' | 'rad', summa, oyinchiId } · sarlavha X-Imzo = HMAC SHA-256 (xom tana, TOLOV_KALITI).
  // Tartib: 1) imzo — yo'q, shakli noto'g'ri yoki mos emas → 401, hech narsa yozilmaydi · 2) maydonlar → 400 ·
  // 3) shu to'lov raqami bor → 200 { takror: true } (xizmat qayta yubormasin, ikkinchi yozuv yo'q) ·
  // 4) yozish → 200 { ok: true } (rad ham yoziladi — «to'lovim qayerda?» savoliga javob uchun; boshqa hech narsa o'zgarmaydi).
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() sorov: RawBodyRequest<Request>, @Headers('x-imzo') imzo: string | undefined) {
    if (!imzoTogrimi(sorov.rawBody, imzo)) throw new UnauthorizedException("Imzo mos emas");

    const tana = (sorov.body ?? {}) as Record<string, unknown>;
    const tolovRaqami = typeof tana.tolovRaqami === 'string' ? tana.tolovRaqami.trim() : '';
    const holat = tana.holat;
    const summa = tana.summa;
    const oyinchiId = tana.oyinchiId;
    if (!tolovRaqami || tolovRaqami.length > 40) throw new BadRequestException("tolovRaqami bo'sh");
    if (typeof holat !== 'string' || !HOLATLAR.includes(holat)) throw new BadRequestException('holat — tolandi yoki rad');
    if (typeof summa !== 'number' || !Number.isInteger(summa) || summa <= 0) {
      throw new BadRequestException("summa — musbat butun son (so'm)");
    }
    if (typeof oyinchiId !== 'number' || !Number.isInteger(oyinchiId) || !(await this.oyinchilar.existsBy({ id: oyinchiId }))) {
      throw new BadRequestException('oyinchiId — mavjud hisob');
    }

    if (await this.tolovlar.existsBy({ tolov_raqami: tolovRaqami })) return { takror: true };
    try {
      await this.tolovlar.insert({ tolov_raqami: tolovRaqami, oyinchi_id: oyinchiId, summa, holat });
    } catch (e) {
      // Ikki bir xil xabar bir vaqtda keldi: ikkinchisini jadvaldagi noyoblik to'xtatdi — u ham takror (500 emas)
      if ((e as { code?: string }).code === '23505') return { takror: true };
      throw e;
    }
    return { ok: true };
  }
}
