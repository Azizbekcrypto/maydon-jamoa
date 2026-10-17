import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { Oyinchi } from './oyinchi.entity.js';

@Controller('kirish')
export class KirishController {
  constructor(
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
    private readonly jwt: JwtService,
  ) {}

  // POST /kirish { telefon, parol } → { token } (30 kun) · noto'g'ri bo'lsa 401 (qaysi biri — aytilmaydi).
  // Parol jadvaldagi hash bilan solishtiriladi; token Database'ga yozilmaydi.
  @Post()
  @HttpCode(200)
  async kirish(@Body() body: Record<string, unknown>) {
    const telefon = typeof body?.telefon === 'string' ? body.telefon.trim() : '';
    const parol = typeof body?.parol === 'string' ? body.parol : '';
    const oyinchi = telefon ? await this.oyinchilar.findOneBy({ telefon }) : null;
    if (!oyinchi || !parol || !(await compare(parol, oyinchi.parol_hash))) {
      throw new UnauthorizedException("Telefon yoki parol noto'g'ri");
    }
    return { token: await this.jwt.signAsync({ sub: oyinchi.id }) };
  }
}
