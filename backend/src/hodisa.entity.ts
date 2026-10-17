import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Qadamlar sanog'i (12-Modul 7-dars): har yozuv — bitta qurilmadagi bitta qadam.
// Ism, login va token yozilmaydi — faqat qadam nomi va qurilma ID. 60 kundan eskilari o'chiriladi.
@Entity('hodisalar')
export class Hodisa {
  @PrimaryGeneratedColumn()
  id: number;

  // Qadam nomi: ochdi · royxatdan-otdi · qoshildi · tasdiqladi; sanoq yozuvi eslatmadan-ochdi (9-dars)
  @Column({ type: 'varchar', length: 40 })
  nom: string;

  // Qurilma ID — ilova birinchi ochilganda yaratgan tasodifiy harf va raqamlar: odamning ismini ham, loginini ham bildirmaydi
  @Column({ type: 'varchar', length: 64 })
  qurilma_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
