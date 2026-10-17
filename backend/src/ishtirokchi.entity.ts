import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Oyin } from './oyin.entity.js';
import { Oyinchi } from './oyinchi.entity.js';

// Kim qaysi o'yinda — har qo'shilish bitta qator.
// (oyin_id, oyinchi_id) — kalit: bitta o'yinchi bitta o'yinda bitta qator.
@Entity('ishtirokchilar')
@Check(`holat IN ('qoshildi', 'keladi', 'navbatda', 'chiqdi')`)
export class Ishtirokchi {
  // Bog'lovchi ustun → oyinlar.id
  @PrimaryColumn({ type: 'int' })
  oyin_id: number;

  // Bog'lovchi ustun → oyinchilar.id
  @PrimaryColumn({ type: 'int' })
  oyinchi_id: number;

  @ManyToOne(() => Oyin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyin_id' })
  oyin: Oyin;

  @ManyToOne(() => Oyinchi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oyinchi_id' })
  oyinchi: Oyinchi;

  // qoshildi · keladi · navbatda · chiqdi
  @Column({ type: 'varchar', length: 10 })
  holat: string;

  // Qator qachon yozilgani — navbat tartibi shundan
  @Column({ type: 'timestamptz', default: () => 'now()' })
  yaratilgan: Date;
}
