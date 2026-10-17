import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Oyinchi } from './oyinchi.entity.js';

// E'lon qilingan o'yin
@Entity('oyinlar')
export class Oyin {
  @PrimaryGeneratedColumn()
  id: number;

  // O'yin kuni — sana: 2026-10-10
  @Column({ type: 'date' })
  kun: string;

  // Boshlanish soati: 18:00
  @Column({ type: 'varchar', length: 5 })
  soat: string;

  @Column({ type: 'varchar', length: 80 })
  maydon: string;

  // Nechta odam kerak — «8 / 10» dagi 10
  @Column({ type: 'int' })
  kerak: number;

  // Bog'lovchi ustun: o'yinni kim e'lon qilgani → oyinchilar.id.
  // Tashkilotchi «Hisobni o'chirish»ni bossa — o'yin o'chmaydi, tashkilotchisi bo'sh qoladi (null)
  @Column({ type: 'int', nullable: true })
  tashkilotchi_id: number | null;

  @ManyToOne(() => Oyinchi, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tashkilotchi_id' })
  tashkilotchi: Oyinchi;

  // «Doimiy o'yin» (13-Modul 4-dars, Pro): har hafta shu kun va soatda o'yin o'zi e'lon qilinadi.
  // Belgi seriyaning eng oxirgi o'yinida turadi: keyingi o'yin yaratilganda yangisiga o'tadi, eskisida o'chadi
  @Column({ type: 'boolean', default: false })
  doimiy: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
