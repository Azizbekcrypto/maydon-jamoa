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
import { telefondanLoginga } from './migratsiya.js';
import { NamunaMalumot } from './namuna.js';
import { OyinlarGateway } from './oyinlar.gateway.js';
import { Oyin } from './oyin.entity.js';
import { Oyinchi } from './oyinchi.entity.js';
import { OyinlarController } from './oyinlar.controller.js';
import { RoyxatController } from './royxat.controller.js';
import { TokenGuard } from './token.guard.js';
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
        entities: [Oyinchi, Oyin, Ishtirokchi, Hodisa, Tolov],
        // Jadvallar entity'lardan o'zi yaratiladi (README'dagi arxitektura bo'yicha)
        synchronize: true,
      }),
      // Avval bir martalik o'tkazish (telefon → login, 12-Modul 7-dars), keyin jadvallar entity'lardan yangilanadi
      dataSourceFactory: async (options) => {
        await telefondanLoginga(process.env.DATABASE_URL);
        return new DataSource(options!).initialize();
      },
    }),
    TypeOrmModule.forFeature([Oyinchi, Oyin, Ishtirokchi, Hodisa, Tolov]),
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
  ],
  providers: [NamunaMalumot, TokenGuard, OyinlarGateway, HodisalarTozalash],
})
export class AppModule {}
