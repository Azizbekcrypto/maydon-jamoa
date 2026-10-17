import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';
import { TokenGuard, type Sorov } from '../token.guard.js';
import { proBormi } from './pro.js';

@Controller('men')
@UseGuards(TokenGuard)
export class MenController {
  constructor(@InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>) {}

  // GET /men — kirgan o'yinchining o'z holati (token bilan; tokensiz 401):
  // { pro: pro_gacha hozirdan keyinmi, proGacha: '2026-11-06T…Z' | null }. Ilova Pro holatini shundan o'qiydi.
  @Get()
  async men(@Req() sorov: Sorov) {
    const men = await this.oyinchilar.findOneByOrFail({ id: sorov.oyinchiId! });
    return { pro: proBormi(men.pro_gacha), proGacha: men.pro_gacha ? men.pro_gacha.toISOString() : null };
  }
}
