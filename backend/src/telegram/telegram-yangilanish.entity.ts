import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// Ishlangan Telegram so'rovlari (13-Modul 8-dars): Telegram javob olmasa so'rovni qayta yuboradi —
// bir xil update_id ikkinchi marta kelsa, qayta ishlanmaydi (Backend qayta ishga tushsa ham). Xabar matni va ism yozilmaydi.
@Entity('telegram_yangilanishlar')
export class TelegramYangilanish {
  @PrimaryColumn({ type: 'bigint' })
  update_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
