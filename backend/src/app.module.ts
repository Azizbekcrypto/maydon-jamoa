import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller.js';
import { HisobController } from './hisob.controller.js';
import { Hodisa } from './hodisa.entity.js';
import { HodisalarController, HodisalarTozalash } from './hodisalar.controller.js';
import { Ishtirokchi } from './ishtirokchi.entity.js';
import { KirishController } from './kirish.controller.js';
import { MenController } from './men/men.controller.js';
import { telefondanLoginga } from './migratsiya.js';
import { NamunaMalumot } from './namuna.js';
import { OyinlarGateway } from './oyinlar.gateway.js';
import { Oyin } from './oyin.entity.js';
import { Oyinchi } from './oyinchi.entity.js';
import { OyinlarController } from './oyinlar.controller.js';
import { RoyxatController } from './royxat.controller.js';
import { TaklifMukofoti } from './taklif/mukofot.service.js';
import { OyinchiQurilma } from './taklif/oyinchi-qurilma.entity.js';
import { TaklifNatija } from './taklif/taklif-natija.entity.js';
import { TelegramXabar } from './telegram/telegram-xabar.entity.js';
import { TelegramYangilanish } from './telegram/telegram-yangilanish.entity.js';
import { TelegramController } from './telegram/telegram.controller.js';
import { TelegramXizmati } from './telegram/telegram.service.js';
import { YanaElonXabari } from './telegram/yana-elon.service.js';
import { TokenGuard } from './token.guard.js';
import { BoshlanganTolov } from './tolov/boshlangan-tolov.entity.js';
import { MashqTolovController } from './tolov/mashq.controller.js';
import { TolovController } from './tolov/tolov.controller.js';
import { Tolov } from './tolov/tolov.entity.js';

@Module({
  imports: [
    // backend/.env dagi qiymatlar process.env ga o'qiladi
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Oyinchi, Oyin, Ishtirokchi, Hodisa, Tolov, BoshlanganTolov, TelegramYangilanish, TelegramXabar, OyinchiQurilma, TaklifNatija],
        // Jadvallar entity'lardan o'zi yaratiladi (README'dagi arxitektura bo'yicha)
        synchronize: true,
      }),
      // Avval bir martalik o'tkazish (telefon → login, 12-Modul 7-dars), keyin jadvallar entity'lardan yangilanadi
      dataSourceFactory: async (options) => {
        await telefondanLoginga(process.env.DATABASE_URL);
        return new DataSource(options!).initialize();
      },
    }),
    TypeOrmModule.forFeature([Oyinchi, Oyin, Ishtirokchi, Hodisa, Tolov, BoshlanganTolov, TelegramYangilanish, TelegramXabar, OyinchiQurilma, TaklifNatija]),
    // Token backend/.env dagi JWT_SECRET bilan imzolanadi, 30 kun amal qiladi.
    // Kalit faqat .env dan: kodda zaxira qiymat yo'q, kalit bo'lmasa Backend ishga tushmaydi.
    JwtModule.registerAsync({
      useFactory: () => {
        const kalit = process.env.JWT_SECRET;
        if (!kalit) throw new Error("JWT_SECRET yo'q — backend/.env ga yozing");
        return { secret: kalit, signOptions: { expiresIn: '30d' } };
      },
    }),
  ],
  controllers: [
    AppController,
    RoyxatController,
    KirishController,
    OyinlarController,
    HisobController,
    HodisalarController,
    TolovController,
    MashqTolovController,
    MenController,
    TelegramController,
  ],
  providers: [NamunaMalumot, TokenGuard, OyinlarGateway, HodisalarTozalash, TelegramXizmati, YanaElonXabari, TaklifMukofoti],
})
export class AppModule {}
