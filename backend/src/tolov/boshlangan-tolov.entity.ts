import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';

// Boshlangan to'lovlar (13-Modul 4-dars): «To'lovga o'tish» bosilganda Backend to'lov raqamini beradi va shu yerga yozadi —
// mashq sahifasi va to'lov xabari hisob va summani shu yozuvdan oladi (begona raqam bilan Pro yoqib bo'lmaydi).
// tolovlar ga emas — aks holda birinchi to'lov xabari «takror» bo'lib qolardi.
@Entity('boshlangan_tolovlar')
export class BoshlanganTolov {
  @PrimaryGeneratedColumn()
  id: number;

  // m- va 12 ta tasodifiy harf-raqam (ketma-ket emas: raqam manzilda turadi)
  @Column({ type: 'varchar', length: 40, unique: true })
  tolov_raqami: string;

  // To'lovni boshlagan (kirgan) tashkilotchi
  @Column({ type: 'int' })
  oyinchi_id: number;

  @ManyToOne(() => Oyinchi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyinchi_id' })
  oyinchi: Oyinchi;

  // So'mda — PRO_NARX dan
  @Column({ type: 'int' })
  summa: number;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
