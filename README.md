# maydon-jamoa

«Maydon Jamoa» — mahalladagi mini-futbol uchun jamoa yig'adigan mahsulot: tashkilotchi o'yin e'lon qiladi
(kun, soat, maydon, nechta odam kerak), boshqa o'yinchilar «Qo'shilaman» ni bosadi; e'londa «8 / 10» — qo'shilganlar / kerak.

Bu repo — 11-Modul Mentor misoli, boshlang'ich holat: prototip, ilova va Backend'ni darslarda qurasiz.

## Talab (7-dars)

Prototip agentga shu talab va `wireframe.jpg` surati bilan qurildi:

> **Qayerda:** `prototip/` papkasi — yangi React + Vite loyihasi; `README.md`.
> **Nima qilsin:** `wireframe.jpg` dagi ekranlar — O'yinlar: o'yin kartalari, har birida kun, soat, maydon, «8 / 10», pastda «E'lon berish»; O'yin: «‹ O'yinlar», kun, soat, maydon, «8 / 10», qo'shilganlar (10 ta joy, ismsiz doiralar), «Qo'shilaman»;
> E'lon berish: kun, soat, maydon, nechta odam, «Yuborish». Ma'lumot `prototip/src/namuna.js` da: 4 ta o'yin, Shanba va Yakshanba.
> Ekranlar bir-biriga bosib o'tilsin: karta → O'yin, «E'lon berish» → E'lon berish, «Yuborish» → O'yinlar; «Qo'shilaman» sonni bittaga oshirsin. `README.md` ga shu talabni va `wireframe.jpg` suratini qo'sh.
> **Nima buzilmasin:** haqiqiy ma'lumot va Backend yo'q — hammasi faqat ochiq sahifada. `prototip/` va `README.md` dan tashqariga tegma, o'zgargan fayllarni ayt.

![Wireframe — O'yinlar · O'yin · E'lon berish](wireframe.jpg)

Bu prototip ma'lumotni saqlamaydi: ma'lumot `prototip/src/namuna.js` da, Backend yo'q — sahifa yangilansa, yana «8 / 10».

## Arxitektura

Uch qism: ilova ko'rsatadi, Backend tekshiradi, Database saqlaydi.

```
ilova (Expo) → Backend (NestJS) → Database (Neon)
   so'rov →        tekshiradi →      saqlaydi
   ← javob
```

Asosiy funksiyalar (PRD): o'yin e'loni va qo'shilish · o'yin kuni tasdiq · chiqish va navbat.
Saqlanadigan ma'lumotlar: o'yinchilar · o'yinlar · kim qaysi o'yinga qo'shilgani.

### Jadvallar

**`oyinchilar`** — ro'yxatdan o'tgan odamlar

| Ustun | Nima saqlaydi |
|---|---|
| `id` | o'yinchi raqami (Database o'zi to'ldiradi) |
| `ism` | ismi |
| `telefon` | telefon raqami — kirishda ishlatiladi, bitta telefon bir marta |
| `parol_hash` | hash — paroldan yasalgan satr: undan parolni qaytarib bo'lmaydi (parolning o'zi saqlanmaydi) |

**`oyinlar`** — e'lon qilingan o'yinlar

| Ustun | Nima saqlaydi |
|---|---|
| `id` | o'yin raqami (Database o'zi to'ldiradi) |
| `kun` | o'yin kuni — sana, masalan `2026-10-10` |
| `soat` | boshlanish soati, masalan `18:00` |
| `maydon` | maydon nomi, masalan «Mahalla maydoni» |
| `kerak` | nechta odam kerak — «8 / 10» dagi 10 |
| `tashkilotchi_id` | o'yinni kim e'lon qilgani → `oyinchilar.id` |
| `yaratilgan` | e'lon qachon berilgani (Database o'zi to'ldiradi) |

**`ishtirokchilar`** — kim qaysi o'yinda; har qo'shilish — bitta qator

| Ustun | Nima saqlaydi |
|---|---|
| `oyin_id` | qaysi o'yin → `oyinlar.id` |
| `oyinchi_id` | qaysi o'yinchi → `oyinchilar.id` |
| `holat` | `qoshildi` · `keladi` (o'yin kuni «Kelaman» bosgan) · `navbatda` · `chiqdi` |
| `yaratilgan` | qator qachon yozilgani — navbat tartibi shundan (Database o'zi to'ldiradi) |

Bog'lovchi ustunlar — boshqa jadvaldagi qatorni ko'rsatadigan ustun: `oyinlar.tashkilotchi_id` → `oyinchilar` ·
`ishtirokchilar.oyin_id` → `oyinlar` · `ishtirokchilar.oyinchi_id` → `oyinchilar`.

| Funksiya | Qaysi jadvalga nima yozadi |
|---|---|
| O'yin e'loni va qo'shilish | e'lon — `oyinlar` ga qator (`tashkilotchi_id` — e'lon bergan); «Qo'shilaman» — `ishtirokchilar` ga qator, `holat` = `qoshildi` |
| O'yin kuni tasdiq | «Kelaman» — `ishtirokchilar` dagi o'sha qatorda `holat` = `keladi` |
| Chiqish va navbat | to'lgan o'yinga — `ishtirokchilar` ga qator, `holat` = `navbatda`; chiqqanda — `holat` = `chiqdi`, navbatdagi birinchi qator — `qoshildi` |

«8 / 10»: 8 — shu o'yinning `ishtirokchilar` dagi `qoshildi` yoki `keladi` qatorlari soni (`navbatda`, `chiqdi` sanalmaydi), 10 — `oyinlar.kerak`.

### Real vaqt nuqtalari

Real vaqt nuqtasi — ekran ochiq turganda boshqa odam tufayli ma'lumoti o'zgarishi mumkin bo'lgan joy.

| Joy | Ilova qachon so'raydi |
|---|---|
| «8 / 10» | ekran ochilganda va pastga tortib yangilaganda |
| qo'shilganlar ro'yxati | ekran ochilganda va pastga tortib yangilaganda |
| o'yin kunidagi «Kelaman» belgilari | ekran ochilganda va pastga tortib yangilaganda |

Ekran o'zi yangilanishi hozircha yo'q (WebSocket — roadmap'da «keyinroq», 12-Modul).

### Platforma

**Mobil** — o'yinchi maydonda, qo'lida telefon; eslatma telefonga kelishi kerak.

### Stek

| Qism | Texnologiya |
|---|---|
| ilova | Expo (React Native), telefonda Expo Go orqali |
| Backend | NestJS va TypeORM, Render |
| Database | Neon (PostgreSQL) |

## Ishga tushirish

Ikki terminal kerak: Backend va ilova. Avval `.env` fayllari (`.env.example` dan nusxa oling, qiymatlarni o'zingiznikiga almashtiring):
`backend/.env` — `DATABASE_URL` (Neon → Connect → connection string) va `JWT_SECRET` (uzun tasodifiy satr);
`mobil/.env` — `EXPO_PUBLIC_API_URL` (Render'dagi Backend manzili, oxirida `/` siz).

1-terminal — Backend:

```
cd backend
npm install
npm run start:dev
```

`localhost:3000` → «Maydon Jamoa Backend ishlayapti»; `localhost:3000/oyinlar` → `401` (tokensiz yopiq).
Birinchi ishga tushganda jadvallar o'zi yaratiladi va namuna qo'shiladi (bor bo'lsa — qayta qo'shilmaydi):
namuna tashkilotchi (`+998 90 000 00 00`) va to'rt o'yin — keyingi shanba va yakshanba (Toshkent vaqti):
Shanba 18:00 · Mahalla maydoni · 10 kishi · Shanba 20:00 · Maktab maydoni · 10 · Yakshanba 10:00 · Park maydoni · 8 · Yakshanba 17:00 · Mahalla maydoni · 10.

2-terminal — ilova (mobil trek) — telefonda Expo Go kerak (iPhone'da — kompyuterdagi bilan bitta Expo akkaunti: `npx expo login`):

```
cd mobil
npm install
npx expo start
```

Terminaldagi QR'ni skanerlang: Android'da — Expo Go'dagi «Scan QR code», iPhone'da — kamera ilovasi.
QR odatda telefon va kompyuter bitta Wi-Fi'da bo'lsa ochiladi; ochilmasa — `npm i -g @expo/ngrok`, keyin `npx expo start --tunnel` (sekinroq).
Expo Go'dagi ilova kodi kompyuterdagi `npx expo start` dan keladi: u to'xtasa, telefonda ham ochilmaydi; o'yinlar esa `EXPO_PUBLIC_API_URL` dagi Backend'dan.
Ilovada: «Ro'yxatdan o'tish» (namuna ism va namuna telefon, masalan `Ali` · `+998 90 000 00 01` — o'z raqamingizni yozmang) → «Kirish» → «O'yinlar».

Prototip (brauzerda; web-trek namunasi) — telefon ko'rinishi: F12, keyin Ctrl+Shift+M:

```
cd prototip
npm install
npm run dev
```

`localhost:5173` → «Maydon Jamoa», O'yinlar — to'rt namuna o'yin kartasi (600 px dan tor oynada bitta ustunda).

## Maxfiy kalitlar (`.env`)

Qiymatlar repo'ga yozilmaydi — faqat nomlari. Laptopda — `backend/.env` va `mobil/.env` (namuna: `.env.example`), internetda — Render (Environment).

| Nom | Qayerda | Nima |
|---|---|---|
| `DATABASE_URL` | `backend/.env` · Render | Database ulanish qatori (Neon) — maxfiy |
| `JWT_SECRET` | `backend/.env` · Render | tokenni imzolaydigan uzun tasodifiy satr — maxfiy; yo'q bo'lsa Backend ishga tushmaydi |
| `PORT` | `backend/.env` | port; bo'lmasa 3000 (Render o'zi beradi) |
| `WEB_ORIGIN` | `backend/.env` · Render | faqat web-trek: saytning internetdagi manzili (CORS); mobil trekda bo'sh |
| `EXPO_PUBLIC_API_URL` | `mobil/.env` | Backend manzili — maxfiy emas: `EXPO_PUBLIC_` qiymati ilova ichida ochiq ko'rinadi |

Web-trekda sayt Backend manzilini `VITE_API_URL` dan oladi (sayt papkasidagi `.env`; bu repo'dagi `prototip/` Backend'ga ulanmagan — mobil trek namunasi).
Token telefonda `expo-secure-store` da (qiymatni shifrlab saqlaydi); web-trekda — `localStorage`.

## Internetga chiqarish

Telefon laptopdagi Backend'ni `localhost` bilan topmaydi (telefon uchun `localhost` — telefonning o'zi), shuning uchun Backend Render'da turadi.
Avval `git push` — Render kodni GitHub'dagi repo'dan oladi va har push'dan keyin o'zi yangilanadi.

**Backend — Render** (render.com → New > Web Service → `maydon-jamoa` repo):

| Sozlama | Qiymat |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Instance Type | Free |
| Environment | `DATABASE_URL`, `JWT_SECRET` — qiymatlari `backend/.env` dan (bu yerda — faqat nomlari) |

Port — `PORT` o'zgaruvchisidan (Render o'zi beradi), u bo'lmasa — 3000.
Tekshirish: `https://….onrender.com/oyinlar` → `401` — Backend internetda, tokensiz yopiq.
Bepul Backend 15 daqiqa so'rovsiz qolsa uxlaydi — keyingi birinchi javob bir daqiqagacha kechikishi mumkin. Render bepul xizmatni prod uchun tavsiya qilmaydi.

Backend manzili: `https://maydon-jamoa-….onrender.com` (manzil — ochiq qiymat; ilovada — `mobil/.env` dagi `EXPO_PUBLIC_API_URL`).

## Prototip internetda — PWA (web-trek namunasi)

`prototip/public/manifest.webmanifest` (nom, ikonkalar 192 va 512 px, `start_url`, `display: standalone`) va HTTPS manzil —
telefon saytni bosh ekranga ilova kabi qo'shadi. Netlify (app.netlify.com → yangi loyiha → GitHub'dan import):

| Sozlama | Qiymat |
|---|---|
| Base directory | `prototip` |
| Build command | `npm run build` |
| Publish directory | `dist` |

Havola — `https://….netlify.app`; har push'dan keyin sayt o'zi yangilanadi.
Telefonda: Android Chrome — «⋮» → «Install and create shortcut»; iPhone Safari — «Share» → «Add to Home Screen».

## Darslar va teglar

Teglar: `m11-dars-NN-start` — dars boshidagi holat, `m11-dars-NN-done` — dars oxiridagi holat.
`m11-dars-07-start` — boshlang'ich holat (`main`); keyingi dars boshi — oldingi dars oxiri. Yechim commitlari — `yechim` tarmog'ida.

| Teg | Dars | Nima bor |
|---|---|---|
| `m11-dars-07-done` | 7 · jonli prototip | `PRD.md` (5-darsdan), `wireframe.jpg`; `prototip/` (React + Vite + `motion`): uch ekran — O'yinlar · O'yin · E'lon berish, namuna ma'lumot `prototip/src/namuna.js` (4 o'yin, Shanba va Yakshanba); uch animatsiya — karta kichrayib qaytadi, «8 / 10» dagi son kattalashib qaytadi, ekranlar Motion bilan almashadi; `README.md` — talab va wireframe surati |
| `m11-dars-08-done` | 8 · arxitektura va platforma | `README.md` «Arxitektura» bo'limi: chizma (ilova · Backend · Database), uch jadval (`oyinchilar` · `oyinlar` · `ishtirokchilar`) va bog'lovchi ustunlar, real vaqt nuqtalari, platforma (mobil) va bir gapli asos, stek; kod o'zgarmagan |
| `m11-dars-09-done` | 9 · telefonda | `mobil/` (Expo, `npx create-expo-app@latest mobil`; Expo Router, TypeScript): `src/app/_layout.tsx` — `<Stack />`, `index.tsx` — O'yinlar, `oyin/[id].tsx` — O'yin (to'rt o'yin bitta faylda, `id` manzildan), `elon.tsx` — E'lon berish; namuna ma'lumot `mobil/src/namuna.ts` (prototipdagidek, `id` '1'…'4'); karta kichrayib qaytadi, son kattalashib qaytadi; shablondagi `explore` va pastki tablar olib tashlangan. Web-trek namunasi: `prototip/` adaptiv (600 px dan tor oynada bitta ustun) va PWA — `public/manifest.webmanifest`, `ikonka-192.png`, `ikonka-512.png` |
| `m11-dars-10-done` | 10 · poydevor | `backend/` (NestJS + TypeORM, Database — Neon): jadvallar `oyinchilar` · `oyinlar` · `ishtirokchilar` (README'dagidek); `POST /royxat` (`ism`, `telefon`, `parol` → parolning faqat hash'i, telefon takrorlansa `409` «Bu telefon ro'yxatdan o'tgan»), `POST /kirish` (`telefon`, `parol` → token, 30 kun), `GET /oyinlar` — faqat token bilan (tokensiz `401`), eng yangisi tepada (`yaratilgan` bo'yicha kamayib); namuna tashkilotchi va to'rt o'yin; port — `PORT` yoki 3000; README «Internetga chiqarish» (Render). `mobil/`: «Ro'yxatdan o'tish» (`royxat.tsx`) va «Kirish» (`kirish.tsx`), token `expo-secure-store` da, Backend manzili — `EXPO_PUBLIC_API_URL`; «O'yinlar» Backend'dan («N kishi kerak»), `401` da token o'chadi va «Kirish» ochiladi, «Hisobdan chiqish». «O'yin» va «E'lon berish» hali namuna ma'lumotda |
| `m11-dars-11-done` | 11 · 1-asosiy funksiya: o'yin e'loni va qo'shilish | `POST /oyinlar` (`kun`, `soat`, `maydon`, `kerak`; tashkilotchi — token egasi, formada «kim» yo'q; bo'sh maydon bo'lsa `400` «Yozilmagan: …»; yangi e'lon «0 / N»); `POST /oyinlar/:id/qoshilish` → `ishtirokchilar` ga `qoshildi` (to'lgan o'yinda `409` «O'yin to'ldi», takror — `409` «Siz bu o'yinga qo'shilgansiz»; (`oyin_id`, `oyinchi_id`) — Database kaliti); `GET /oyinlar` da `qoshilgan` (`qoshildi` + `keladi`) va `menQoshilganman`; namuna: 9 ta namuna o'yinchi (`+998 90 000 00 11` … `19`), qo'shilganlar 8 · 6 · 4 · 9. Ilovada: «E'lon berish» Backend'ga (kun — bugundan 7 kun ichidan), «8 / 10» Backend'dan, «Qo'shilaman» → «Qo'shildingiz», ekran ochilganda va pastga tortilganda qayta so'raladi, to'lgan o'yin kartasida «to'ldi», «O'yin» ekranida «O'yin to'ldi» |

## Ortda qoldingizmi

```
git clone https://github.com/Azizbekcrypto/maydon-jamoa
cd maydon-jamoa
git checkout -f m11-dars-NN-done
```

Mentor misolini alohida papkada ochib, qanday ishlashini ko'rasiz; o'z repo'ngizdagi qadamni shunga qarab qaytarasiz.
`-f` shu papkadagi o'zgarishlarni o'chiradi.
