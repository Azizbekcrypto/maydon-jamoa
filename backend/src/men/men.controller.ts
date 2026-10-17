import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';
import { QURILMA_QOIDASI, qurilmaYoz } from '../taklif/qurilma.js';
import { TokenGuard, type Sorov } from '../token.guard.js';
import { BoshlanganTolov } from '../tolov/boshlangan-tolov.entity.js';
import { Tolov } from '../tolov/tolov.entity.js';
import { proBormi } from './pro.js';

@Controller('men')
@UseGuards(TokenGuard)
export class MenController {
  constructor(
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    @InjectRepository(BoshlanganTolov) private readonly boshlanganlar: Repository<BoshlanganTolov>,
    @InjectRepository(Tolov) private readonly tolovlar: Repository<Tolov>,
  ) {}

  // POST /men/qurilma { qurilmaId } (10-dars) — shu qurilma kirgan hisobning qurilmalari ro'yxatiga (kirishda va «Havolani ulashish»da)
  @Post('qurilma')
  @HttpCode(200)
  async qurilma(@Req() sorov: Sorov, @Body() body: Record<string, unknown>) {
    if (typeof body?.qurilmaId !== 'string' || !QURILMA_QOIDASI.test(body.qurilmaId)) {
      throw new BadRequestException('qurilmaId — 8–64 harf va raqam');
    }
    await qurilmaYoz(this.oyinchilar.manager, sorov.oyinchiId!, body.qurilmaId);
    return {};
  }

  // GET /men — kirgan o'yinchining o'z holati (token bilan; tokensiz 401):
  // { pro: pro_gacha hozirdan keyinmi, proGacha: '2026-11-06T…Z' | null, oxirgiTolov }. Ilova Pro holatini shundan o'qiydi.
  // oxirgiTolov (5-dars) — shu o'yinchining eng oxirgi boshlangan to'lovi: { tolovRaqami, holat } — holat tolovlar dagi
  // tolandi yoki rad; to'lov xabari hali kelmagan bo'lsa — kutilmoqda. To'lov boshlanmagan bo'lsa — null. telegram — 8-dars.
  @Get()
  async men(@Req() sorov: Sorov) {
    const men = await this.oyinchilar.findOneByOrFail({ id: sorov.oyinchiId! });
    const boshlangan = await this.boshlanganlar.findOne({
      where: { oyinchi_id: men.id },
      order: { yaratilgan: 'DESC', id: 'DESC' },
    });
    let oxirgiTolov: { tolovRaqami: string; holat: string } | null = null;
    if (boshlangan) {
      const tolov = await this.tolovlar.findOneBy({ tolov_raqami: boshlangan.tolov_raqami });
      oxirgiTolov = { tolovRaqami: boshlangan.tolov_raqami, holat: tolov?.holat ?? 'kutilmoqda' };
    }
    return {
      pro: proBormi(men.pro_gacha),
      proGacha: men.pro_gacha ? men.pro_gacha.toISOString() : null,
      oxirgiTolov,
      // Telegram ulanganmi (8-dars) — chat raqamining o'zi ilovaga yuborilmaydi
      telegram: men.telegram_chat_id !== null,
      // Taklif kodi (10-dars) — «Havolani ulashish» shaxsiy havolasi uchun
      taklifKodi: men.taklif_kodi,
    };
  }
}
