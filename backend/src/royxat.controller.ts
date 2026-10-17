import { BadRequestException, Body, ConflictException, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { LOGIN_QOIDASI } from './login.js';
import { Oyinchi } from './oyinchi.entity.js';
import { taklifKodiToqnashdi, yangiTaklifKodi } from './taklif/kod.js';

function matn(q: unknown): string {
  return typeof q === 'string' ? q.trim() : '';
}

@Controller('royxat')
export class RoyxatController {
  constructor(@InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>) {}

  // POST /royxat { ism, login, parol, taklifKodi? } → 201 { id, ism } · token bermaydi — ilova «Kirish»ni ochadi.
  // Telefon raqami so'ralmaydi. Login — o'zi tanlagan nom: 3–20 belgi, harf va raqam (kichik harfda saqlanadi:
  // «Ali» va «ali» — bitta login); band bo'lsa — 409 «Bu login band».
  // Parol jadvalga yozilmaydi — faqat hash'i (parol_hash). Forma orqali o'tgan har akkaunt — namuna = false.
  // taklifKodi (13-Modul 10-dars, «Taklif kodi (bo'lsa)», majburiy emas): bo'shliqlari olib tashlanib katta harfga o'tkaziladi
  // (ab12cd ham AB12CD) va shu taklif_kodi li hisob topiladi → taklif_qilgan_id. Topilmasa — 400, hisob ochilmaydi.
  @Post()
  async royxat(@Body() body: Record<string, unknown>) {
    const ism = matn(body?.ism);
    const login = matn(body?.login).toLowerCase();
    const parol = typeof body?.parol === 'string' ? body.parol : '';
    if (!ism || !login || !parol) {
      throw new BadRequestException('Ism, login va parolni yozing');
    }
    if (ism.length > 60) throw new BadRequestException('Ism — 60 belgigacha');
    if (!LOGIN_QOIDASI.test(login)) {
      throw new BadRequestException('Login — 3–20 belgi: harf va raqam');
    }
    if (await this.oyinchilar.existsBy({ login })) {
      throw new ConflictException('Bu login band');
    }
    const taklifKodi = typeof body?.taklifKodi === 'string' ? body.taklifKodi.replace(/\s+/g, '').toUpperCase() : '';
    let taklif_qilgan_id: number | null = null;
    if (taklifKodi) {
      const taklifQilgan = await this.oyinchilar.findOne({ where: { taklif_kodi: taklifKodi }, select: { id: true } });
      if (!taklifQilgan) {
        throw new BadRequestException("Bunday taklif kodi topilmadi — tekshiring yoki maydonni bo'sh qoldiring.");
      }
      taklif_qilgan_id = taklifQilgan.id;
    }
    const parol_hash = await hash(parol, 10);
    // Yangi hisobga taklif kodi (13-Modul 10-dars); kod to'qnashsa — yangi kod bilan qayta yoziladi
    for (;;) {
      try {
        const oyinchi = await this.oyinchilar.save({
          ism,
          login,
          parol_hash,
          namuna: false,
          taklif_kodi: yangiTaklifKodi(),
          taklif_qilgan_id,
        });
        return { id: oyinchi.id, ism: oyinchi.ism };
      } catch (e) {
        if (taklifKodiToqnashdi(e)) continue;
        // Ikki so'rov bir vaqtda kelsa — Database'dagi unique qoidasi ushlaydi
        if ((e as { code?: string }).code === '23505') {
          throw new ConflictException('Bu login band');
        }
        throw e;
      }
    }
  }
}
