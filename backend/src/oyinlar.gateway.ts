import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

// gateway — Backend'da ulanishlarni qabul qiladigan klass (socket.io). HTTP server bilan bitta portda turadi.
// Ilova bir marta ulanadi va ulanayotganda tokenni yuboradi: io(manzil, { auth: { token } }).
// Token ulanish ochilayotganda tekshiriladi: yo'q yoki yaroqsiz bo'lsa — ulanish yopiladi
// (Backend yopgan ulanishga ilova o'zi qayta ulanmaydi — belgi «Ulanmagan»).
// Hodisa `oyin-ozgardi` — { oyinId, sabab }: faqat qaysi o'yin o'zgargani va nega; yangi holatni ilova GET /oyinlar dan qayta so'raydi.

// Real vaqt oqimi sxemasidagi besh sabab (README «Real vaqt»)
export type OyinSababi = 'qoshildi' | 'chiqdi' | 'tasdiqladi' | 'navbatga-yozildi' | 'elon-berildi';

@WebSocketGateway()
export class OyinlarGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger('Ulanish');

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(ulanish: Socket) {
    const token = ulanish.handshake.auth?.token;
    const oyinchiId = this.tokenYaroqli(token);
    if (!oyinchiId) {
      ulanish.disconnect();
      return;
    }
    // Token egasi — keyingi darslarda kerak bo'ladi (xona, o'z harakati)
    ulanish.data.oyinchiId = oyinchiId;
    this.log.log(`ulandi: o'yinchi ${oyinchiId}`);
  }

  // Database'dagi o'zgarish tugagandan keyin chaqiriladi (tranzaksiya bo'lsa — u tugagach). Oladi — hamma ulangan ilova.
  oyinOzgardi(oyinId: number, sabab: OyinSababi) {
    this.server.emit('oyin-ozgardi', { oyinId, sabab });
  }

  handleDisconnect(ulanish: Socket) {
    if (ulanish.data.oyinchiId) this.log.log(`uzildi: o'yinchi ${ulanish.data.oyinchiId}`);
  }

  // Token yopiq so'rovlardagi kabi JWT_SECRET bilan tekshiriladi (sinxron — ulanish ochilayotgan paytning o'zida).
  // Yaroqli bo'lsa — token egasining id si, aks holda null.
  private tokenYaroqli(token: unknown): number | null {
    if (typeof token !== 'string' || !token) return null;
    try {
      return this.jwt.verify<{ sub: number }>(token).sub;
    } catch {
      return null;
    }
  }
}
