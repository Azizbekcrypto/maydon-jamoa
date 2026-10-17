import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type Sorov = { headers: Record<string, string | undefined>; oyinchiId?: number };

// Yopiq yo'llar: so'rovda to'g'ri token bo'lmasa — 401.
// Token egasi (kirgan o'yinchi) — sorov.oyinchiId.
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const sorov = context.switchToHttp().getRequest<Sorov>();
    const [turi, token] = (sorov.headers.authorization ?? '').split(' ');
    if (turi !== 'Bearer' || !token) throw new UnauthorizedException();
    try {
      const yuk = await this.jwt.verifyAsync<{ sub: number }>(token);
      sorov.oyinchiId = yuk.sub;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
