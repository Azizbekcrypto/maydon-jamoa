import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Oyin } from '../oyin.entity.js';
import { Oyinchi } from '../oyinchi.entity.js';

// Yuborilgan Telegram xabarlari (13-Modul 8-dars): kimga, qaysi o'yin haqida, qachon — xabar matni va chat raqamisiz.
// Haftalik chegara (dushanba–yakshanba, Toshkent vaqti: bir odamga ko'pi bilan ikkita) shu jadvaldan sanaladi;
// (oyinchi_id, oyin_id) jufti noyob — bitta o'yin haqida bitta odamga bir marta.
@Entity('telegram_xabarlar')
@Index(['oyinchi_id', 'oyin_id'], { unique: true })
export class TelegramXabar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  oyinchi_id: number;

  @ManyToOne(() => Oyinchi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyinchi_id' })
  oyinchi: Oyinchi;

  @Column({ type: 'int' })
  oyin_id: number;

  @ManyToOne(() => Oyin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyin_id' })
  oyin: Oyin;

  @CreateDateColumn({ type: 'timestamptz' })
  yuborilgan: Date;
}
