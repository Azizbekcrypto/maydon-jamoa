import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oyin } from './oyin.entity.js';
import { TokenGuard } from './token.guard.js';

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
}
