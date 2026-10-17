import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { Ishtirokchi } from './ishtirokchi.entity.js';
import { Oyin } from './oyin.entity.js';
import { Oyinchi } from './oyinchi.entity.js';
import { keyingiShanbaYakshanba } from './sana.js';

// Namuna akkauntlar loginlari — ismidan (login.ts dagi qoida bilan): 7-darsdagi migratsiya eski namunalarga ham shularni beradi.
// Hammasi namuna = true — sanoqqa kirmaydi.
const TASHKILOTCHI_ISMI = 'Namuna tashkilotchi';
const TASHKILOTCHI_LOGIN = 'namunatashkilotchi';
// 9 ta namuna o'yinchi: namunaoyinchi1 … namunaoyinchi9
const OYINCHI_ISMLARI = Array.from({ length: 9 }, (_, i) => `Namuna o'yinchi ${i + 1}`);
const OYINCHI_LOGINLARI = Array.from({ length: 9 }, (_, i) => `namunaoyinchi${i + 1}`);
// To'rt namuna o'yinga qo'shilganlar (yozilgan tartibida): Shanba 18:00 — 8, Shanba 20:00 — 6, Yakshanba 10:00 — 4, Yakshanba 17:00 — 9
const QOSHILGANLAR = [8, 6, 4, 9];

// Tekshirish uchun namuna: bitta tashkilotchi va to'rtta o'yin — keyingi shanba va yakshanba;
// 9 ta namuna o'yinchi va ularning qo'shilishlari («8 / 10» · «6 / 10» · «4 / 8» · «9 / 10»).
// Bor bo'lsa — qayta qo'shilmaydi. Namunalarning paroli tasodifiy (hech kim ular bilan kirmaydi).
@Injectable()
export class NamunaMalumot implements OnApplicationBootstrap {
  private readonly log = new Logger('Namuna');

  constructor(
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    @InjectRepository(Oyin) private readonly oyinlar: Repository<Oyin>,
    @InjectRepository(Ishtirokchi) private readonly ishtirokchilar: Repository<Ishtirokchi>,
  ) {}

  private async parolHash() {
    return hash(randomBytes(24).toString('hex'), 10);
  }

  async onApplicationBootstrap() {
    let tashkilotchi = await this.oyinchilar.findOneBy({ login: TASHKILOTCHI_LOGIN });
    if (!tashkilotchi) {
      tashkilotchi = await this.oyinchilar.save({
        ism: TASHKILOTCHI_ISMI,
        login: TASHKILOTCHI_LOGIN,
        parol_hash: await this.parolHash(),
        namuna: true,
      });
    }
    if (!(await this.oyinlar.existsBy({ tashkilotchi_id: tashkilotchi.id }))) {
      await this.oyinlarQosh(tashkilotchi.id);
    }
    await this.qoshilganlarQosh(tashkilotchi.id);
  }

  private async oyinlarQosh(tashkilotchiId: number) {
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
      await this.oyinlar.insert({ ...n, tashkilotchi_id: tashkilotchiId, yaratilgan: new Date(boshi + i * 60_000) });
    }
    this.log.log(`Namuna o'yinlar: ${shanba} va ${yakshanba}`);
  }

  // 9 ta namuna o'yinchi va qo'shilishlar — kirgan o'yinchi ular qatorida emas.
  // Namuna o'yinchilar bor bo'lsa — qayta qo'shilmaydi.
  private async qoshilganlarQosh(tashkilotchiId: number) {
    if (await this.oyinchilar.existsBy({ login: OYINCHI_LOGINLARI[0] })) return;
    const oyinchilar: Oyinchi[] = [];
    for (const [i, login] of OYINCHI_LOGINLARI.entries()) {
      oyinchilar.push(
        await this.oyinchilar.save({ ism: OYINCHI_ISMLARI[i], login, parol_hash: await this.parolHash(), namuna: true }),
      );
    }
    const oyinlar = await this.oyinlar.find({
      where: { tashkilotchi_id: tashkilotchiId },
      order: { yaratilgan: 'ASC', id: 'ASC' },
      take: QOSHILGANLAR.length,
    });
    for (const [i, oyin] of oyinlar.entries()) {
      const qatorlar = oyinchilar
        .slice(0, QOSHILGANLAR[i])
        .map((o) => ({ oyin_id: oyin.id, oyinchi_id: o.id, holat: 'qoshildi' }));
      await this.ishtirokchilar.insert(qatorlar);
    }
    this.log.log("Namuna o'yinchilar: 9 ta, qo'shilganlar 8 · 6 · 4 · 9");
  }
}
