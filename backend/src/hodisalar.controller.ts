import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Hodisa } from './hodisa.entity.js';
import { Oyinchi } from './oyinchi.entity.js';
import { OyinlarGateway } from './oyinlar.gateway.js';
import { sanoqKalitiTogrimi } from './sanoq.js';

// Qadamlar (Mentor misolida to'rtta): ochdi → ro'yxatdan o'tdi → qo'shildi → kelishini tasdiqladi.
// Nomlar kichik harf va chiziqcha bilan, bo'lib o'tgan ish ma'nosida.
export const QADAMLAR = ['ochdi', 'royxatdan-otdi', 'qoshildi', 'tasdiqladi'];

const SAQLASH_KUN = 60; // qadamlar yozuvi — 60 kun

@Controller('hodisalar')
export class HodisalarController {
  constructor(
    @InjectRepository(Hodisa) private readonly hodisalar: Repository<Hodisa>,
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    private readonly ulanishlar: OyinlarGateway,
  ) {}

  // POST /hodisalar { nom, qurilma_id } → 201 — token kerak emas va yuborilmaydi: ism, login, token yozilmaydi.
  // nom faqat QADAMLAR dan biri, aks holda 400.
  @Post()
  async yoz(@Body() body: Record<string, unknown>) {
    const nom = typeof body?.nom === 'string' ? body.nom : '';
    const qurilmaId = typeof body?.qurilma_id === 'string' ? body.qurilma_id.trim() : '';
    if (!QADAMLAR.includes(nom)) throw new BadRequestException(`Qadam nomi: ${QADAMLAR.join(', ')}`);
    if (!/^[a-zA-Z0-9]{8,64}$/.test(qurilmaId)) throw new BadRequestException("qurilma_id — 8–64 harf va raqam");
    await this.hodisalar.insert({ nom, qurilma_id: qurilmaId });
    // Yozuv saqlanib tugadi — ochiq sanoq sahifalari sonlarni qayta so'raydi
    this.ulanishlar.sanoqOzgardi();
    return {};
  }

  // GET /hodisalar/sanoq — faqat maxfiy kalit bilan: so'rov sarlavhasida `X-Sanoq-Kaliti` (backend/.env dagi SANOQ_KALITI);
  // kalit yo'q yoki mos emas — 401. Javob — faqat sonlar (ism, login, qurilma ID yo'q):
  // { qadamlar: [{ nom, soni }] — QADAMLAR tartibida, har birida turli qurilma_id lar soni,
  //   royxatdanOtgan — oyinchilar dagi namuna = false akkauntlar soni }.
  // ?dan=2026-10-20T12:00:00Z — shu vaqtdan keyingi yozuvlar bo'yicha (royxatdanOtgan — shu vaqtdan keyin o'tganlar).
  @Get('sanoq')
  async sanoq(@Headers('x-sanoq-kaliti') kalit: string | undefined, @Query('dan') dan?: string) {
    if (!sanoqKalitiTogrimi(kalit)) throw new UnauthorizedException();
    const danVaqt = dan ? new Date(dan) : null;
    if (danVaqt && Number.isNaN(danVaqt.getTime())) throw new BadRequestException("dan — vaqt, masalan 2026-10-20T12:00:00Z");

    const qatorlar: { nom: string; soni: string }[] = await this.hodisalar
      .createQueryBuilder('h')
      .select('h.nom', 'nom')
      .addSelect('COUNT(DISTINCT h.qurilma_id)', 'soni')
      .where(danVaqt ? 'h.yaratilgan >= :dan' : '1 = 1', { dan: danVaqt })
      .groupBy('h.nom')
      .getRawMany();
    const sonlar = new Map(qatorlar.map((q) => [q.nom, Number(q.soni)]));
    const royxatdanOtgan = await this.oyinchilar
      .createQueryBuilder('o')
      .where('o.namuna = false')
      .andWhere(danVaqt ? 'o.yaratilgan >= :dan' : '1 = 1', { dan: danVaqt })
      .getCount();
    return { qadamlar: QADAMLAR.map((nom) => ({ nom, soni: sonlar.get(nom) ?? 0 })), royxatdanOtgan };
  }
}

// 60 kundan eski qadam yozuvlari o'chiriladi — Backend ishga tushganda va keyin har 24 soatda (DELETE … WHERE yaratilgan < …)
@Injectable()
export class HodisalarTozalash implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly log = new Logger('Hodisalar');
  private soat: ReturnType<typeof setInterval> | undefined;

  constructor(@InjectRepository(Hodisa) private readonly hodisalar: Repository<Hodisa>) {}

  async onApplicationBootstrap() {
    await this.tozala();
    this.soat = setInterval(() => this.tozala().catch((e) => this.log.error(e)), 24 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    clearInterval(this.soat);
  }

  private async tozala() {
    const chegara = new Date(Date.now() - SAQLASH_KUN * 24 * 60 * 60 * 1000);
    const { affected } = await this.hodisalar.delete({ yaratilgan: LessThan(chegara) });
    if (affected) this.log.log(`${SAQLASH_KUN} kundan eski ${affected} ta yozuv o'chirildi`);
  }
}
