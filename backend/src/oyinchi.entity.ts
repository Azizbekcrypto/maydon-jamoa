import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Ro'yxatdan o'tgan odam. Parolning o'zi saqlanmaydi — faqat hash'i. Telefon raqami so'ralmaydi (12-Modul 7-dars).
@Entity('oyinchilar')
export class Oyinchi {
  @PrimaryGeneratedColumn()
  id: number;

  // O'yinchilar ko'radigan nom (familiya shart emas)
  @Column({ type: 'varchar', length: 60 })
  ism: string;

  // Kirish uchun o'zi tanlagan nom: 3–20 belgi, harf va raqam, kichik harfda; takrorlanmaydi. Boshqa o'yinchilar ko'rmaydi
  @Column({ type: 'varchar', length: 20, unique: true })
  login: string;

  // hash — paroldan yasalgan satr: undan parolni qaytarib bo'lmaydi ($2b$10$… — bcrypt)
  @Column({ type: 'varchar' })
  parol_hash: string;

  // Namuna va tekshiruv akkauntlari — true (sanoqqa kirmaydi); ro'yxatdan o'tish formasi har doim false yozadi
  @Column({ type: 'boolean', default: false })
  namuna: boolean;

  // Ro'yxatdan o'tgan vaqt (Database o'zi to'ldiradi)
  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
