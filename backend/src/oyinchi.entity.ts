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

  // Pro muddati (13-Modul 4-dars): shu vaqtgacha Pro — sana yoki bo'sh (Pro yo'q). Muddat tugagach Pro o'zi to'xtaydi —
  // avtomatik to'lov (pul yechish) yo'q. Mavjud akkauntlarda bo'sh
  @Column({ type: 'timestamptz', nullable: true })
  pro_gacha: Date | null;

  // Telegram chat raqami (13-Modul 8-dars) — faqat xabar yuborish uchun; o'yinchi botda «Start»ni o'zi bosganda yoziladi,
  // «Telegram xabarlarini o'chirish»da o'chadi. Katta son (52 bitgacha) — bigint, to'liq saqlanadi; ilovaga yuborilmaydi
  @Column({ type: 'bigint', nullable: true })
  telegram_chat_id: string | null;

  // Bir martalik kod (16 harf-raqam) va amal qilish muddati (10 daqiqa): «Telegram'da xabar olish» → t.me/<bot>?start=<kod>
  @Column({ type: 'varchar', length: 16, nullable: true, unique: true })
  telegram_kod: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  telegram_kod_gacha: Date | null;

  // Taklif kodi (13-Modul 10-dars): 6 belgi, katta harf va raqam, noyob — taklif havolasi …/?taklif=<kod>&kanal=taklif
  @Column({ type: 'varchar', length: 6, nullable: true, unique: true })
  taklif_kodi: string | null;

  // Ro'yxatdan o'tgan vaqt (Database o'zi to'ldiradi)
  @CreateDateColumn({ type: 'timestamptz' })
  yaratilgan: Date;
}
