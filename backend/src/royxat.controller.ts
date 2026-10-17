import { BadRequestException, Body, ConflictException, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { Oyinchi } from './oyinchi.entity.js';

function matn(q: unknown): string {
  return typeof q === 'string' ? q.trim() : '';
}

@Controller('royxat')
export class RoyxatController {
  constructor(@InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>) {}

  // POST /royxat { ism, telefon, parol } → 201 { id, ism } · token bermaydi — ilova «Kirish»ni ochadi.
  // Parol jadvalga yozilmaydi — faqat hash'i (parol_hash). Telefon takrorlansa — 409.
  @Post()
  async royxat(@Body() body: Record<string, unknown>) {
    const ism = matn(body?.ism);
    const telefon = matn(body?.telefon);
    const parol = typeof body?.parol === 'string' ? body.parol : '';
    if (!ism || !telefon || !parol) {
      throw new BadRequestException('Ism, telefon va parolni yozing');
    }
    if (await this.oyinchilar.existsBy({ telefon })) {
      throw new ConflictException("Bu telefon ro'yxatdan o'tgan");
    }
    try {
      const oyinchi = await this.oyinchilar.save({ ism, telefon, parol_hash: await hash(parol, 10) });
      return { id: oyinchi.id, ism: oyinchi.ism };
    } catch (e) {
      // Ikki so'rov bir vaqtda kelsa — Database'dagi unique qoidasi ushlaydi
      if ((e as { code?: string }).code === '23505') {
        throw new ConflictException("Bu telefon ro'yxatdan o'tgan");
      }
      throw e;
    }
  }
}
