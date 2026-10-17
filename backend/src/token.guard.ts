import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oyinchi } from './oyinchi.entity.js';

export type Sorov = { headers: Record<string, string | undefined>; oyinchiId?: number };

// Yopiq yo'llar: so'rovda to'g'ri token bo'lmasa — 401.
// Token egasi (kirgan o'yinchi) — sorov.oyinchiId. «Hisobni o'chirish»dan keyin eski token ham 401 (akkaunt yo'q).
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Oyinchi) private readonly oyinchilar: Repository<Oyinchi>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const sorov = context.switchToHttp().getRequest<Sorov>();
    const [turi, token] = (sorov.headers.authorization ?? '').split(' ');
    if (turi !== 'Bearer' || !token) throw new UnauthorizedException();
    let yuk: { sub: number };
    try {
      yuk = await this.jwt.verifyAsync<{ sub: number }>(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!(await this.oyinchilar.existsBy({ id: yuk.sub }))) throw new UnauthorizedException();
    sorov.oyinchiId = yuk.sub;
    return true;
  }
}
