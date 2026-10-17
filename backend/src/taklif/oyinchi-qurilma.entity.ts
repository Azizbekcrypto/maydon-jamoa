import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';

// Hisob ishlatilgan qurilmalar (13-Modul 10-dars): ro'yxatdan o'tishda, kirishda va «Havolani ulashish» bosilganda yoziladi;
// eskisi o'chmaydi — hisob bir nechta qurilmada ishlatilishi mumkin. Taklif mukofotida «bir qurilma» qoidasi shundan.
// Qurilma ID — 12-Moduldagi tasodifiy harf va raqamlar: ismni ham, loginni ham bildirmaydi.
@Entity('oyinchi_qurilmalari')
@Index(['oyinchi_id', 'qurilma_id'], { unique: true })
export class OyinchiQurilma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  oyinchi_id: number;

  @ManyToOne(() => Oyinchi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyinchi_id' })
  oyinchi: Oyinchi;

  @Column({ type: 'varchar', length: 64 })
  qurilma_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
