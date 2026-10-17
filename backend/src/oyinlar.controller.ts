import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oyin } from './oyin.entity.js';
import { sanaTogrimi } from './sana.js';
import { TokenGuard, type Sorov } from './token.guard.js';

@Controller('oyinlar')
@UseGuards(TokenGuard)
export class OyinlarController {
  constructor(@InjectRepository(Oyin) private readonly oyinlar: Repository<Oyin>) {}

  // GET /oyinlar — faqat token bilan (tokensiz 401).
  // Eng yangi e'lon tepada: yaratilgan bo'yicha kamayib.
  // → [{ id, kun: '2026-10-11', soat: '17:00', maydon, kerak }]
  @Get()
  async royxat() {
    return this.oyinlar.find({
      select: { id: true, kun: true, soat: true, maydon: true, kerak: true },
      order: { yaratilgan: 'DESC', id: 'DESC' },
    });
  }

  // POST /oyinlar { kun: '2026-10-11', soat: '19:00', maydon, kerak } → 201 — yangi e'lon.
  // Tashkilotchi — token egasi: formada «kim» so'ralmaydi. Biror maydon bo'sh bo'lsa — 400, hech narsa yozilmaydi.
  // Tashkilotchi e'lon berganda o'zi qo'shilmaydi — yangi e'lon «0 / N».
  @Post()
  async elon(@Req() sorov: Sorov, @Body() body: Record<string, unknown>) {
    const kun = typeof body?.kun === 'string' ? body.kun.trim() : '';
    const soat = typeof body?.soat === 'string' ? body.soat.trim() : '';
    const maydon = typeof body?.maydon === 'string' ? body.maydon.trim() : '';
    const kerak = Number(body?.kerak);

    const yoq: string[] = [];
    if (!kun) yoq.push('kun');
    if (!soat) yoq.push('soat');
    if (!maydon) yoq.push('maydon');
    if (body?.kerak === undefined || body?.kerak === null || body?.kerak === '') yoq.push('nechta odam');
    if (yoq.length) throw new BadRequestException(`Yozilmagan: ${yoq.join(', ')}`);

    if (!sanaTogrimi(kun)) throw new BadRequestException("Kun — sana bo'lsin, masalan 2026-10-11");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(soat)) throw new BadRequestException('Soatni 19:00 kabi yozing');
    if (!Number.isInteger(kerak) || kerak < 1) throw new BadRequestException("Nechta odam — butun son bo'lsin");

    const oyin = await this.oyinlar.save({ kun, soat, maydon, kerak, tashkilotchi_id: sorov.oyinchiId! });
    return { id: oyin.id, kun: oyin.kun, soat: oyin.soat, maydon: oyin.maydon, kerak: oyin.kerak };
  }
}
