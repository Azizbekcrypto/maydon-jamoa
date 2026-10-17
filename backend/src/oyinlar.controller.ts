import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ishtirokchi } from './ishtirokchi.entity.js';
import { Oyin } from './oyin.entity.js';
import { bugunToshkent, sanaTogrimi } from './sana.js';
import { TokenGuard, type Sorov } from './token.guard.js';

// «8 / 10» dagi 8 — shu o'yinda holati qoshildi yoki keladi bo'lgan qatorlar (navbatda, chiqdi sanalmaydi)
export const QOSHILGAN = ['qoshildi', 'keladi'];

// Tasdiq qoidasi (bitta joyda — …/tasdiq ham, GET /oyinlar dagi menTasdiqlayOlaman ham shundan):
// o'yin kuni (Toshkent vaqti) va o'yinga qo'shilgan
function tasdiqRuxsati(kun: string, holat: string, bugun: string): boolean {
  return kun === bugun && QOSHILGAN.includes(holat);
}

@Controller('oyinlar')
@UseGuards(TokenGuard)
export class OyinlarController {
  constructor(
    @InjectRepository(Oyin) private readonly oyinlar: Repository<Oyin>,
    @InjectRepository(Ishtirokchi) private readonly ishtirokchilar: Repository<Ishtirokchi>,
  ) {}

  // GET /oyinlar — faqat token bilan (tokensiz 401). Yagona ro'yxat yo'li: «O'yin» ekrani ham shundan o'qiydi.
  // Eng yangi e'lon tepada: yaratilgan bo'yicha kamayib.
  // → [{ id, kun: '2026-10-11', soat: '17:00', maydon, kerak, qoshilgan, menQoshilganman,
  //      tasdiqlagan, menTasdiqlaganman, menTasdiqlayOlaman, navbatda, menNavbatdaman }]
  // navbatda — navbatdagilar soni; menNavbatdaman — kirgan o'yinchi navbatdami.
  // tasdiqlagan — kelishini tasdiqlaganlar (keladi) soni; faqat o'yinni e'lon qilgan o'yinchiga, boshqalarga — null.
  // menTasdiqlayOlaman — POST …/tasdiq dagi o'sha qoida (o'yin kuni, qo'shilgan) va hali tasdiqlamagan:
  // «Kelaman» faqat shunda chiqadi, ilova sanani o'zi solishtirmaydi.
  @Get()
  async royxat(@Req() sorov: Sorov) {
    const men = sorov.oyinchiId!;
    const oyinlar = await this.oyinlar.find({
      select: { id: true, kun: true, soat: true, maydon: true, kerak: true, tashkilotchi_id: true },
      order: { yaratilgan: 'DESC', id: 'DESC' },
    });
    const sanoq: { oyin_id: number; qoshilgan: string; tasdiqlagan: string; navbatda: string }[] =
      await this.ishtirokchilar
        .createQueryBuilder('i')
        .select('i.oyin_id', 'oyin_id')
        .addSelect(`COUNT(*) FILTER (WHERE i.holat IN ('qoshildi', 'keladi'))`, 'qoshilgan')
        .addSelect(`COUNT(*) FILTER (WHERE i.holat = 'keladi')`, 'tasdiqlagan')
        .addSelect(`COUNT(*) FILTER (WHERE i.holat = 'navbatda')`, 'navbatda')
        .groupBy('i.oyin_id')
        .getRawMany();
    const sonlar = new Map(sanoq.map((q) => [q.oyin_id, q]));
    const meniki = new Map(
      (await this.ishtirokchilar.find({ where: { oyinchi_id: men } })).map((i) => [i.oyin_id, i.holat]),
    );
    const bugun = bugunToshkent();
    return oyinlar.map(({ tashkilotchi_id, ...o }) => {
      const son = sonlar.get(o.id);
      const holat = meniki.get(o.id) ?? '';
      return {
        ...o,
        qoshilgan: Number(son?.qoshilgan ?? 0),
        menQoshilganman: QOSHILGAN.includes(holat),
        tasdiqlagan: tashkilotchi_id === men ? Number(son?.tasdiqlagan ?? 0) : null,
        menTasdiqlaganman: holat === 'keladi',
        menTasdiqlayOlaman: tasdiqRuxsati(o.kun, holat, bugun) && holat !== 'keladi',
        navbatda: Number(son?.navbatda ?? 0),
        menNavbatdaman: holat === 'navbatda',
      };
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

  // POST /oyinlar/:id/qoshilish → 201 { holat: 'qoshildi' } — ishtirokchilar ga qator.
  // O'yin to'lgan bo'lsa — 409 «O'yin to'ldi»; bu o'yinchi oldin qo'shilgan bo'lsa — 409 «Siz bu o'yinga qo'shilgansiz».
  // Ikki marta bosilsa ham bitta qator: (oyin_id, oyinchi_id) — Database kaliti, ikkinchisi 409.
  // Oldin chiqqan (yoki navbatdagi) o'yinchi — o'sha qatori qoshildi bo'ladi, yangi qator yozilmaydi.
  @Post(':id/qoshilish')
  async qoshilish(@Req() sorov: Sorov, @Param('id', ParseIntPipe) id: number) {
    const men = sorov.oyinchiId!;
    const oyin = await this.oyinlar.findOneBy({ id });
    if (!oyin) throw new NotFoundException("O'yin topilmadi");

    const qator = await this.ishtirokchilar.findOneBy({ oyin_id: id, oyinchi_id: men });
    if (qator && QOSHILGAN.includes(qator.holat)) throw new ConflictException("Siz bu o'yinga qo'shilgansiz");

    const soni = await this.ishtirokchilar.countBy({ oyin_id: id, holat: In(QOSHILGAN) });
    if (soni >= oyin.kerak) throw new ConflictException("O'yin to'ldi");

    await this.yoz(this.ishtirokchilar, id, men, 'qoshildi', !!qator);
    return { holat: 'qoshildi' };
  }

  // POST /oyinlar/:id/navbat → 201 { holat: 'navbatda' } — faqat to'lgan o'yinga (to'lmagan bo'lsa — 409).
  // Navbat tartibi — yaratilgan: birinchi yozilgan birinchi qo'shiladi (qayta yozilsa — navbat oxiriga).
  @Post(':id/navbat')
  async navbat(@Req() sorov: Sorov, @Param('id', ParseIntPipe) id: number) {
    const men = sorov.oyinchiId!;
    const oyin = await this.oyinlar.findOneBy({ id });
    if (!oyin) throw new NotFoundException("O'yin topilmadi");

    const qator = await this.ishtirokchilar.findOneBy({ oyin_id: id, oyinchi_id: men });
    if (qator && QOSHILGAN.includes(qator.holat)) throw new ConflictException("Siz bu o'yinga qo'shilgansiz");
    if (qator?.holat === 'navbatda') throw new ConflictException('Siz navbatdasiz');

    const soni = await this.ishtirokchilar.countBy({ oyin_id: id, holat: In(QOSHILGAN) });
    if (soni < oyin.kerak) throw new ConflictException("O'yin to'lmagan — «Qo'shilaman» ni bosing");

    await this.yoz(this.ishtirokchilar, id, men, 'navbatda', !!qator);
    return { holat: 'navbatda' };
  }

  // POST /oyinlar/:id/chiqish → 201 { holat: 'chiqdi' } — qo'shilgan yoki navbatdagi o'yinchi chiqadi.
  // Qo'shilgan o'yinchi chiqsa va navbatda odam bo'lsa — navbatga eng birinchi yozilgan o'yinchi qoshildi bo'ladi.
  @Post(':id/chiqish')
  async chiqish(@Req() sorov: Sorov, @Param('id', ParseIntPipe) id: number) {
    const men = sorov.oyinchiId!;
    const oyin = await this.oyinlar.findOneBy({ id });
    if (!oyin) throw new NotFoundException("O'yin topilmadi");

    const qator = await this.ishtirokchilar.findOneBy({ oyin_id: id, oyinchi_id: men });
    if (!qator || qator.holat === 'chiqdi') throw new ConflictException("Siz bu o'yinda yo'qsiz");

    await this.ishtirokchilar.update({ oyin_id: id, oyinchi_id: men }, { holat: 'chiqdi' });
    if (QOSHILGAN.includes(qator.holat)) {
      const navbatdagi = await this.ishtirokchilar.findOne({
        where: { oyin_id: id, holat: 'navbatda' },
        order: { yaratilgan: 'ASC' },
      });
      if (navbatdagi) {
        await this.ishtirokchilar.update({ oyin_id: id, oyinchi_id: navbatdagi.oyinchi_id }, { holat: 'qoshildi' });
      }
    }
    return { holat: 'chiqdi' };
  }

  // Qator yozish: shu o'yinda bu o'yinchining qatori bo'lsa — holati va vaqti yangilanadi (bitta qator), bo'lmasa — yangi qator.
  // Ikki marta tez bosilsa, ikkinchi insert Database kalitiga uriladi — 409.
  private async yoz(jadval: Repository<Ishtirokchi>, oyin_id: number, oyinchi_id: number, holat: string, bor: boolean) {
    if (bor) {
      await jadval.update({ oyin_id, oyinchi_id }, { holat, yaratilgan: new Date() });
      return;
    }
    try {
      await jadval.insert({ oyin_id, oyinchi_id, holat });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException("Siz bu o'yinga qo'shilgansiz");
      }
      throw e;
    }
  }

  // POST /oyinlar/:id/tasdiq → 201 { holat: 'keladi' } — o'yin kuni «Kelaman».
  // Ruxsatni Backend beradi (har so'rovda): faqat o'yin kuni («bugun» — Toshkent vaqti) va faqat o'yinga qo'shilgan
  // o'yinchiga (holati qoshildi yoki keladi). Aks holda 403 va sabab — jadval o'zgarmaydi. Token yo'q — 401.
  @Post(':id/tasdiq')
  async tasdiq(@Req() sorov: Sorov, @Param('id', ParseIntPipe) id: number) {
    const men = sorov.oyinchiId!;
    const oyin = await this.oyinlar.findOneBy({ id });
    if (!oyin) throw new NotFoundException("O'yin topilmadi");
    if (oyin.kun !== bugunToshkent()) throw new ForbiddenException("Tasdiq faqat o'yin kuni");

    const qator = await this.ishtirokchilar.findOneBy({ oyin_id: id, oyinchi_id: men });
    if (!tasdiqRuxsati(oyin.kun, qator?.holat ?? '', bugunToshkent())) {
      throw new ForbiddenException("Siz bu o'yinga qo'shilmagansiz");
    }

    await this.ishtirokchilar.update({ oyin_id: id, oyinchi_id: men }, { holat: 'keladi' });
    return { holat: 'keladi' };
  }
}
