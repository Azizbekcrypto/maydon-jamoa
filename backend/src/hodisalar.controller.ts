import {
  BadRequestException,
  Body,
  Controller,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Hodisa } from './hodisa.entity.js';

// Qadamlar (Mentor misolida to'rtta): ochdi → ro'yxatdan o'tdi → qo'shildi → kelishini tasdiqladi.
// Nomlar kichik harf va chiziqcha bilan, bo'lib o'tgan ish ma'nosida.
export const QADAMLAR = ['ochdi', 'royxatdan-otdi', 'qoshildi', 'tasdiqladi'];

const SAQLASH_KUN = 60; // qadamlar yozuvi — 60 kun

@Controller('hodisalar')
export class HodisalarController {
  constructor(@InjectRepository(Hodisa) private readonly hodisalar: Repository<Hodisa>) {}

  // POST /hodisalar { nom, qurilma_id } → 201 — token kerak emas va yuborilmaydi: ism, login, token yozilmaydi.
  // nom faqat QADAMLAR dan biri, aks holda 400.
  @Post()
  async yoz(@Body() body: Record<string, unknown>) {
    const nom = typeof body?.nom === 'string' ? body.nom : '';
    const qurilmaId = typeof body?.qurilma_id === 'string' ? body.qurilma_id.trim() : '';
    if (!QADAMLAR.includes(nom)) throw new BadRequestException(`Qadam nomi: ${QADAMLAR.join(', ')}`);
    if (!/^[a-zA-Z0-9]{8,64}$/.test(qurilmaId)) throw new BadRequestException("qurilma_id — 8–64 harf va raqam");
    await this.hodisalar.insert({ nom, qurilma_id: qurilmaId });
    return {};
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
