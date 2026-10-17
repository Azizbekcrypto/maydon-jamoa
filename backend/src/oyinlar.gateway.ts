import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { sanoqKalitiTogrimi } from './sanoq.js';

// gateway — Backend'da ulanishlarni qabul qiladigan klass (socket.io). HTTP server bilan bitta portda turadi.
// Ilova bir marta ulanadi va ulanayotganda tokenni yuboradi: io(manzil, { auth: { token } }).
// Token ulanish ochilayotganda tekshiriladi: yo'q yoki yaroqsiz bo'lsa — ulanish yopiladi
// (Backend yopgan ulanishga ilova o'zi qayta ulanmaydi — belgi «Ulanmagan»).
// Hodisa `oyin-ozgardi` — { oyinId, sabab }: faqat qaysi o'yin o'zgargani va nega; yangi holatni ilova GET /oyinlar dan qayta so'raydi.
//
// Xona — Backend'dagi ulanishlar guruhi: hodisa faqat shu guruhdagilarga boradi. Har o'yinning o'z xonasi — `oyin-{id}`.
// Ilova «O'yin» ekrani ochilganda `oyin-ochildi` { oyinId } yuboradi — ulanish xonaga qo'shiladi; yopilganda — `oyin-yopildi`.
// Xonadagi ulanishlar soni o'zgarsa (ulanish uzilganda ham) — xonaga `korayotganlar-ozgardi` { oyinId, soni }.
// Bu son Database'da yo'q — faqat Backend xotirasidagi ulanishlardan, shuning uchun hodisa sonning o'zini olib keladi.
// Ism yuborilmaydi — faqat son; birligi — ochiq ekran (bitta odam ikki qurilmada — ikkita).
//
// Sanoq sahifasi (lending/sanoq.html, 8-dars) ulanayotganda token o'rniga maxfiy kalitni yuboradi (auth.sanoqKaliti):
// kalit to'g'ri bo'lsa — ulanish faqat `sanoq` xonasiga qo'shiladi (o'yin xonalari va o'yin hodisalari unga bormaydi),
// noto'g'ri bo'lsa — yopiladi. Yangi qadam yozuvi saqlanib tugagach shu xonaga `sanoq-ozgardi` — sahifa sonlarni qayta so'raydi.
// Ilovaning token bilan ulanishlari — `ilova` xonasida: `oyin-ozgardi` faqat ularga.

const xona = (oyinId: number) => `oyin-${oyinId}`;
const ILOVA_XONASI = 'ilova';
const SANOQ_XONASI = 'sanoq';

// Real vaqt oqimi sxemasidagi besh sabab (README «Real vaqt»)
export type OyinSababi = 'qoshildi' | 'chiqdi' | 'tasdiqladi' | 'navbatga-yozildi' | 'elon-berildi';

@WebSocketGateway()
export class OyinlarGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger('Ulanish');

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(ulanish: Socket) {
    const sanoqKaliti = ulanish.handshake.auth?.sanoqKaliti;
    if (sanoqKaliti !== undefined) {
      if (!sanoqKalitiTogrimi(sanoqKaliti)) {
        ulanish.disconnect();
        return;
      }
      ulanish.join(SANOQ_XONASI);
      return;
    }
    const token = ulanish.handshake.auth?.token;
    const oyinchiId = this.tokenYaroqli(token);
    if (!oyinchiId) {
      ulanish.disconnect();
      return;
    }
    // Token egasi va shu ulanishda ochiq turgan o'yin ekranlari (uzilganda qolganlarga yangi son yuborish uchun)
    ulanish.data.oyinchiId = oyinchiId;
    ulanish.data.ochiq = new Set<number>();
    ulanish.join(ILOVA_XONASI);
    this.log.log(`ulandi: o'yinchi ${oyinchiId}`);
  }

  // Database'dagi o'zgarish tugagandan keyin chaqiriladi (tranzaksiya bo'lsa — u tugagach). Oladi — hamma ulangan ilova.
  oyinOzgardi(oyinId: number, sabab: OyinSababi) {
    this.server.to(ILOVA_XONASI).emit('oyin-ozgardi', { oyinId, sabab });
  }

  // POST /hodisalar yangi qatorni yozib tugatgandan keyin — faqat sanoq sahifalariga
  sanoqOzgardi() {
    this.server.to(SANOQ_XONASI).emit('sanoq-ozgardi');
  }

  @SubscribeMessage('oyin-ochildi')
  async ochildi(@ConnectedSocket() ulanish: Socket, @MessageBody() malumot: { oyinId?: unknown }) {
    const oyinId = Number(malumot?.oyinId);
    if (!ulanish.data.oyinchiId || !Number.isInteger(oyinId)) return;
    await ulanish.join(xona(oyinId));
    ulanish.data.ochiq.add(oyinId);
    await this.korayotganlarniYubor(oyinId);
  }

  @SubscribeMessage('oyin-yopildi')
  async yopildi(@ConnectedSocket() ulanish: Socket, @MessageBody() malumot: { oyinId?: unknown }) {
    const oyinId = Number(malumot?.oyinId);
    if (!ulanish.data.oyinchiId || !Number.isInteger(oyinId)) return;
    await ulanish.leave(xona(oyinId));
    ulanish.data.ochiq.delete(oyinId);
    await this.korayotganlarniYubor(oyinId);
  }

  // Ulanish uzilganda u hamma xonadan o'zi chiqadi — u ochib turgan har o'yin xonasiga yangi son
  async handleDisconnect(ulanish: Socket) {
    if (!ulanish.data.oyinchiId) return;
    this.log.log(`uzildi: o'yinchi ${ulanish.data.oyinchiId}`);
    for (const oyinId of ulanish.data.ochiq as Set<number>) await this.korayotganlarniYubor(oyinId);
  }

  // «Hozir ko'ryapti: N» — xonadagi ulanishlar soni (o'quvchining o'zi ham sanaladi)
  private async korayotganlarniYubor(oyinId: number) {
    const soni = (await this.server.in(xona(oyinId)).fetchSockets()).length;
    this.server.to(xona(oyinId)).emit('korayotganlar-ozgardi', { oyinId, soni });
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
