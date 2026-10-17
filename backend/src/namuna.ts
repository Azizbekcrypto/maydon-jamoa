import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { Oyin } from './oyin.entity.js';
import { Oyinchi } from './oyinchi.entity.js';
import { keyingiShanbaYakshanba } from './sana.js';

const TASHKILOTCHI_TELEFON = '+998 90 000 00 00';

// Tekshirish uchun namuna: bitta tashkilotchi va to'rtta o'yin — keyingi shanba va yakshanba.
// Bor bo'lsa — qayta qo'shilmaydi. Namuna tashkilotchining paroli tasodifiy (hech kim u bilan kirmaydi).
@Injectable()
export class NamunaMalumot implements OnApplicationBootstrap {
  private readonly log = new Logger('Namuna');

  constructor(
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    @InjectRepository(Oyin) private readonly oyinlar: Repository<Oyin>,
  ) {}

  async onApplicationBootstrap() {
    let tashkilotchi = await this.oyinchilar.findOneBy({ telefon: TASHKILOTCHI_TELEFON });
    if (!tashkilotchi) {
      tashkilotchi = await this.oyinchilar.save({
        ism: 'Namuna tashkilotchi',
        telefon: TASHKILOTCHI_TELEFON,
        parol_hash: await hash(randomBytes(24).toString('hex'), 10),
      });
    }
    if (await this.oyinlar.existsBy({ tashkilotchi_id: tashkilotchi.id })) return;

    const { shanba, yakshanba } = keyingiShanbaYakshanba();
    const namunalar = [
      { kun: shanba, soat: '18:00', maydon: 'Mahalla maydoni', kerak: 10 },
      { kun: shanba, soat: '20:00', maydon: 'Maktab maydoni', kerak: 10 },
      { kun: yakshanba, soat: '10:00', maydon: 'Park maydoni', kerak: 8 },
      { kun: yakshanba, soat: '17:00', maydon: 'Mahalla maydoni', kerak: 10 },
    ];
    // Ro'yxat yaratilgan bo'yicha kamayib turadi: oxirgi yozilgan (Yakshanba 17:00) — tepada
    const boshi = Date.now() - namunalar.length * 60_000;
    for (const [i, n] of namunalar.entries()) {
      await this.oyinlar.insert({ ...n, tashkilotchi_id: tashkilotchi.id, yaratilgan: new Date(boshi + i * 60_000) });
    }
    this.log.log(`Namuna o'yinlar: ${shanba} va ${yakshanba}`);
  }
}
