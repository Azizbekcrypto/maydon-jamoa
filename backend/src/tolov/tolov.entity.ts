import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';

// To'lov xabarlari (13-Modul 3-dars): har to'lov raqami — bitta qator. Test rejim: pul yechilmaydi, karta ma'lumoti yo'q.
// tolov_raqami noyob — bitta to'lov ikki marta yozilmaydi (takror xabar). Rad etilgan to'lov ham yoziladi (holat rad).
@Entity('tolovlar')
export class Tolov {
  @PrimaryGeneratedColumn()
  id: number;

  // To'lov xizmati bergan raqam (mashqda — m-…); bitta raqam jadvalda bir marta
  @Column({ type: 'varchar', length: 40, unique: true })
  tolov_raqami: string;

  // Kim to'lagani → oyinchilar.id (tanada oyinchiId). Hisob o'chirilsa — uning mashq to'lovlari ham o'chadi
  @Column({ type: 'int' })
  oyinchi_id: number;

  @ManyToOne(() => Oyinchi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyinchi_id' })
  oyinchi: Oyinchi;

  // So'mda, butun son (Payme tiyinda yuboradi — mashqda so'm)
  @Column({ type: 'int' })
  summa: number;

  // tolandi · rad
  @Column({ type: 'varchar', length: 10 })
  holat: string;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
