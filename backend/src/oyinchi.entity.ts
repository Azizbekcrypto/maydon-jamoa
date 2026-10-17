import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Ro'yxatdan o'tgan odam. Parolning o'zi saqlanmaydi — faqat hash'i.
@Entity('oyinchilar')
export class Oyinchi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 60 })
  ism: string;

  // Kirishda ishlatiladi: bitta telefon bir marta yoziladi
  @Column({ type: 'varchar', length: 30, unique: true })
  telefon: string;

  // hash — paroldan yasalgan satr: undan parolni qaytarib bo'lmaydi ($2b$10$… — bcrypt)
  @Column({ type: 'varchar' })
  parol_hash: string;
}
