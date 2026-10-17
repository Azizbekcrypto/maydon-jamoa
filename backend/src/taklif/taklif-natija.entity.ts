import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Oyinchi } from '../oyinchi.entity.js';

// Taklif natijalari (13-Modul 10-dars): taklif kodi bilan ochilgan har hisobga bitta yozuv — birinchi asosiy harakatdan keyin.
// natija: berildi (taklif qilganga Pro + 7 kun) · bir-qurilma · namuna · nomalum (taklif qilganning qurilmasi noma'lum) · cheklov (haftasiga 2 tadan ko'p).
// Hisob o'chirilsa — yozuv qoladi, undagi hisob havolasi bo'shatiladi (haftalik sanoq buzilmaydi).
@Entity('taklif_natijalari')
export class TaklifNatija {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  taklif_qilgan_id: number | null;

  @ManyToOne(() => Oyinchi, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'taklif_qilgan_id' })
  taklif_qilgan: Oyinchi | null;

  // Bitta hisobga bitta yozuv — noyob
  @Column({ type: 'int', nullable: true, unique: true })
  taklif_qilingan_id: number | null;

  @OneToOne(() => Oyinchi, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'taklif_qilingan_id' })
  taklif_qilingan: Oyinchi | null;

  @Column({ type: 'varchar', length: 20 })
  natija: string;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
