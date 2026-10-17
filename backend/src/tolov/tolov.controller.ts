import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { randomBytes } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';
import { TokenGuard, type Sorov } from '../token.guard.js';
import { BoshlanganTolov } from './boshlangan-tolov.entity.js';
import { imzoTogrimi } from './imzo.js';
import { ochiqManzil } from './manzil.js';
import { PRO_KUN, PRO_NARX } from './narx.js';
import { Tolov } from './tolov.entity.js';

const HOLATLAR = ['tolandi', 'rad'];
const BELGILAR = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Yangi to'lov raqami: m- va 12 ta tasodifiy harf-raqam (crypto) — taxmin qilib bo'lmaydi
function yangiRaqam(): string {
  return 'm-' + Array.from(randomBytes(12), (b) => BELGILAR[b % BELGILAR.length]).join('');
}

@Controller('tolov')
export class TolovController {
  constructor(
    @InjectRepository(Tolov) private readonly tolovlar: Repository<Tolov>,
    @InjectRepository(BoshlanganTolov) private readonly boshlanganlar: Repository<BoshlanganTolov>,
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  // POST /tolov/boshlash (token bilan, 13-Modul 4-dars) — «To'lovga o'tish»: yangi to'lov raqami kirgan tashkilotchi va summa
  // (PRO_NARX) bilan boshlangan_tolovlar ga yoziladi. → { tolovRaqami, havola } — havola: mashq to'lov sahifasi shu raqam bilan.
  @Post('boshlash')
  @UseGuards(TokenGuard)
  async boshlash(@Req() sorov: Sorov & Request) {
    const tolovRaqami = yangiRaqam();
    await this.boshlanganlar.insert({ tolov_raqami: tolovRaqami, oyinchi_id: sorov.oyinchiId!, summa: PRO_NARX });
    return { tolovRaqami, havola: `${ochiqManzil(sorov)}/tolov-mashq?raqam=${tolovRaqami}` };
  }

  // POST /tolov/webhook — to'lov xabari (webhook): to'lov xizmati (mashqda — «Mashq to'lov» sahifasi) yuboradi.
  // Tana { tolovRaqami, holat: 'tolandi' | 'rad', summa, oyinchiId } · sarlavha X-Imzo = HMAC SHA-256 (xom tana, TOLOV_KALITI).
  // Tartib: 1) imzo — yo'q, shakli noto'g'ri yoki mos emas → 401, hech narsa yozilmaydi · 2) maydonlar → 400 ·
  // hisob va summa xabardan emas — boshlangan_tolovlar dagi shu raqam yozuvidan (yo'q yoki mos emas → 400) ·
  // 3) shu to'lov raqami bor → 200 { takror: true } · 4) yozish → 200 { ok: true } (rad ham yoziladi).
  // Yangi yozilgan tolandi — Pro PRO_KUN kunga uzayadi (Pro bo'lmasa hozirdan, bo'lsa muddat oxiridan); yozuv va Pro — bitta tranzaksiyada,
  // takrorga Pro o'zgarmaydi.
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
    const boshlangan = await this.boshlanganlar.findOneBy({ tolov_raqami: tolovRaqami });
    if (!boshlangan) throw new BadRequestException("Bunday to'lov raqami boshlanmagan");
    if (boshlangan.oyinchi_id !== oyinchiId || boshlangan.summa !== summa) {
      throw new BadRequestException("Hisob yoki summa to'lov raqamiga mos emas");
    }

    try {
      return await this.db.transaction(async (m) => {
        if (await m.getRepository(Tolov).existsBy({ tolov_raqami: tolovRaqami })) return { takror: true };
        await m.getRepository(Tolov).insert({
          tolov_raqami: tolovRaqami,
          oyinchi_id: boshlangan.oyinchi_id,
          summa: boshlangan.summa,
          holat,
        });
        // Pro faqat yangi yozilgan to'lovdan keyin uzayadi (5-dars tuzatishi: avval bu qator takror tekshiruvidan oldin edi —
        // ikki marta kelgan xabar Pro'ni ikki marta uzaytirardi). Yozuv va Pro — bitta tranzaksiyada.
        if (holat === 'tolandi') {
          await m.query(
            `UPDATE oyinchilar SET pro_gacha = GREATEST(COALESCE(pro_gacha, now()), now()) + make_interval(days => $2) WHERE id = $1`,
            [boshlangan.oyinchi_id, PRO_KUN],
          );
        }
        return { ok: true };
      });
    } catch (e) {
      // Ikki bir xil xabar bir vaqtda keldi: ikkinchisini jadvaldagi noyoblik to'xtatdi — u ham takror (500 emas)
      if ((e as { code?: string }).code === '23505') return { takror: true };
      throw e;
    }
  }
}
