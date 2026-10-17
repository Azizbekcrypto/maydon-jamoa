# maydon-jamoa

«Maydon Jamoa» — mahalladagi mini-futbol uchun jamoa yig'adigan mahsulot: tashkilotchi o'yin e'lon qiladi
(kun, soat, maydon, nechta odam kerak), boshqa o'yinchilar «Qo'shilaman» ni bosadi; e'londa «8 / 10» — qo'shilganlar / kerak.

Bu repo — 11 va 12-Modul Mentor misoli: prototip, ilova va Backend'ni 11-Modulda qurasiz, 12-Modulda — lending, real vaqt, eslatma va birinchi foydalanuvchilar.

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
| `login` | kirish uchun o'zi tanlagan nom (3–20 belgi, harf va raqam; kichik harfda; takrorlanmaydi) — boshqa o'yinchilar ko'rmaydi. 12-Modul 7-darsgacha bu yerda `telefon` edi |
| `parol_hash` | hash — paroldan yasalgan satr: undan parolni qaytarib bo'lmaydi (parolning o'zi saqlanmaydi) |
| `namuna` | `true` — namuna va tekshiruv akkauntlari (sanoqqa kirmaydi); ro'yxatdan o'tish formasi har doim `false` yozadi |
| `yaratilgan` | ro'yxatdan o'tgan vaqt (Database o'zi to'ldiradi) |

**`oyinlar`** — e'lon qilingan o'yinlar

| Ustun | Nima saqlaydi |
|---|---|
| `id` | o'yin raqami (Database o'zi to'ldiradi) |
| `kun` | o'yin kuni — sana, masalan `2026-10-10` |
| `soat` | boshlanish soati, masalan `18:00` |
| `maydon` | maydon nomi, masalan «Mahalla maydoni» |
| `kerak` | nechta odam kerak — «8 / 10» dagi 10 |
| `tashkilotchi_id` | o'yinni kim e'lon qilgani → `oyinchilar.id`; tashkilotchi hisobini o'chirsa — bo'sh (`null`), o'yin qoladi |
| `yaratilgan` | e'lon qachon berilgani (Database o'zi to'ldiradi) |

**`ishtirokchilar`** — kim qaysi o'yinda; har qo'shilish — bitta qator

| Ustun | Nima saqlaydi |
|---|---|
| `oyin_id` | qaysi o'yin → `oyinlar.id` |
| `oyinchi_id` | qaysi o'yinchi → `oyinchilar.id` |
| `holat` | `qoshildi` · `keladi` (o'yin kuni «Kelaman» bosgan) · `navbatda` · `chiqdi` |
| `yaratilgan` | qator qachon yozilgani — navbat tartibi shundan (Database o'zi to'ldiradi) |

**`hodisalar`** — qadamlar sanog'i (12-Modul 7-dars): har yozuv — bitta qurilmadagi bitta qadam; ism, login va token yozilmaydi; 60 kundan eskilari o'chiriladi

| Ustun | Nima saqlaydi |
|---|---|
| `id` | yozuv raqami (Database o'zi to'ldiradi) |
| `nom` | qadam: `ochdi` · `royxatdan-otdi` · `qoshildi` · `tasdiqladi`; sanoq yozuvi `eslatmadan-ochdi` (9-dars) |
| `qurilma_id` | qurilma ID — ilova birinchi ochilganda yaratgan tasodifiy harf va raqamlar: odamning ismini ham, loginini ham bildirmaydi |
| `yaratilgan` | yozuv vaqti (Database o'zi to'ldiradi) |

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

11-Modulda ekran o'zi yangilanmasdi (WebSocket — roadmap'da «keyinroq»); 12-Modulda — doimiy ulanish, pastga tortib yangilash qoladi: «Real vaqt» bo'limi.

### Platforma

**Mobil** — o'yinchi maydonda, qo'lida telefon; eslatma telefonga kelishi kerak.

### Stek

| Qism | Texnologiya |
|---|---|
| ilova | Expo (React Native), telefonda Expo Go orqali |
| Backend | NestJS va TypeORM, Render |
| real vaqt | socket.io — doimiy ulanish (imkon bo'lsa WebSocket orqali): Backend'da NestJS gateway (`@nestjs/websockets`, `@nestjs/platform-socket.io`), ilovada `socket.io-client` |
| eslatma | `expo-notifications` — rejalashtirilgan eslatma (ilova o'zi oldindan qo'yadi; Expo Go'da ham ishlaydi) |
| Database | Neon (PostgreSQL) |

## Real vaqt

| Real vaqt nuqtasi | Kim nima qiladi | Hodisa | Kim oladi | Ekranda nima o'zgaradi |
|---|---|---|---|---|
| «8 / 10» va qo'shilganlar ro'yxati | o'yinchi «Qo'shilaman» ni bosadi | `oyin-ozgardi` · sabab `qoshildi` | hamma ulangan ilova | «8 / 10» → «9 / 10», ro'yxatda yangi o'yinchi |
| «8 / 10» va qo'shilganlar ro'yxati | o'yinchi o'yindan chiqadi (navbatdagi kirsa — shu hodisa) | `oyin-ozgardi` · sabab `chiqdi` | hamma ulangan ilova | son va ro'yxat yangilanadi |
| «Kelaman» belgilari | o'yinchi «Kelaman» ni bosadi | `oyin-ozgardi` · sabab `tasdiqladi` | hamma ulangan ilova | «Kelishini tasdiqladi: 7 / 9» → «8 / 9» |
| «Navbatda: N» | o'yinchi navbatga yoziladi | `oyin-ozgardi` · sabab `navbatga-yozildi` | hamma ulangan ilova | «Navbatda: 1» |
| o'yinlar ro'yxati | tashkilotchi o'yin e'lon qiladi | `oyin-ozgardi` · sabab `elon-berildi` | hamma ulangan ilova | ro'yxatda yangi karta |

`oyin-ozgardi` — `{ oyinId, sabab }`. Hodisa o'zgarish bo'lganini aytadi; yangi holatni ilova Backend'dan qayta so'raydi.
Backend hodisani o'zgarish Database'ga yozib tugatilgandan keyin yuboradi (tranzaksiya bo'lsa — u tugagach); ilova bitta hodisadan keyin `GET /oyinlar` ni bir marta so'raydi — «O'yinlar» va «O'yin» shu javobdan o'qiydi.

### Ulanish holatlari

- Ulangan — belgi «Ulangan», o'zgarishlar o'zi ko'rinadi.
- Ulanmoqda — belgi «Ulanmoqda…», ro'yxat ekranda qoladi (eskirgan bo'lishi mumkin).
- Ulanmagan — belgi «Ulanmagan», pastga tortib yangilash ishlaydi.

### Chekka holatlar

1) Internet uzilib qaytsa — ro'yxat yangi holatni ko'rsatsin.
2) Bitta o'zgarish ekranni bir marta yangilasin — ulanish qayta tiklangandan keyin ham.
3) Ilova boshqa ekranda yoki fonda turganda o'zgarish bo'lsa — «O'yinlar»ga qaytganda yangi holat ko'rinsin.

Chekka holatlar 5-darsda uch usul bilan buzib tekshirildi (internetni uzish · fonga olib qaytarish · Backend'ning yangi versiyasi) — yozuv `BUZISH.md` da.
Topilgan uch muammo tuzatilgan: qayta ulanganda ro'yxat qayta so'raladi · `oyin-ozgardi` tinglovchisi bir marta (`connect` dan tashqarida) · qayta ulanganda ilova ochiq o'yin xonasiga qayta kiradi.

### Xona, «Hozir ko'ryapti», jonli xabar va eslatma

| Hodisa | Kim yuboradi → kim oladi | Ma'lumot |
|---|---|---|
| `oyin-ozgardi` | Backend → hamma ulangan ilova | `{ oyinId, sabab }` |
| `oyin-ochildi` · `oyin-yopildi` | ilova («O'yin» ekrani ochildi / yopildi) → Backend | `{ oyinId }` |
| `korayotganlar-ozgardi` | Backend → xona `oyin-{id}` | `{ oyinId, soni }` |

- **Xona** — Backend'dagi ulanishlar guruhi: hodisa faqat shu guruhdagilarga boradi; har o'yinning o'z xonasi `oyin-{id}`.
  **«Hozir ko'ryapti: N»** — «O'yin» ekranini hozir ochib turgan ulanishlar (o'zingiz ham sanalasiz; ism yo'q). Bu son Database'da yo'q — shuning uchun hodisa sonning o'zini olib keladi.
- **Jonli xabar** — ilova ochiq turganda ekran tepasida bir necha soniya: faqat o'zingizga tegishli o'yin uchun (qo'shilgan, navbatda yoki o'zingiz e'lon qilgan), o'z harakatingiz uchun emas, ismsiz.
  Qaysi xabar — hodisadan keyingi `GET /oyinlar` javobi oldingisi bilan solishtirib: «Shanba, 18:00 — yana bir o'yinchi qo'shildi: 9 / 10» · «… — o'yin to'ldi: 10 / 10» · «… — joy bo'shadi: 8 / 10» ·
  «… — kelishini tasdiqladi: 8 / 9» (faqat tashkilotchiga) · «Navbatdan o'yinga o'tdingiz: Shanba, 18:00».
- **Eslatma** — rejalashtirilgan: «Qo'shilaman» bosilganda ilova o'yindan bir soat oldinga qo'yadi («Maydon Jamoa» · «Bugun, 18:00 · Mahalla maydoni»), bir soatdan kam qolgan bo'lsa — qo'yilmaydi;
  «O'yindan chiqish» — bekor. Faqat shu telefonda: boshqa telefondan kirilsa — u yerda eslatma yo'q; telefonda eslatmalar o'chirilgan bo'lsa — chiqmaydi.
  Yopiq ilovada boshqa odamning o'zgarishi («joy bo'shadi») ko'rinmaydi. Backend yuboradigan eslatma (push notification) — qurilmagan: Google yoki Apple xizmati va alohida sozlash kerak, Expo Go'da ishlamaydi.
- **«N joy qoldi»** (9-dars) — o'zingiz qo'shilmagan o'yinda bir yoki ikki joy qolganda: «Shanba, 18:00 — 2 joy qoldi» (yangi hodisa yo'q — son qayta so'ralgan javobdan; ilova ochiq davrda bir o'yinda bir xil son uchun bir marta).
- **Uch kunlik eslatma** (9-dars, `mobil/src/eslatma.ts`) — ilova har ochilganda oldingisi bekor, yangisi uch kundan keyin 17:00 ga: «Hafta oxiriga o'yin bormi? E'lonlarni ko'ring» —
  ilovani uch kun ochmagan odamga chiqadi (yopiq ilova yangi e'lonni bilmaydi — matn taklif qiladi); faqat hisobga kirgan foydalanuvchiga, «Hisobdan chiqish»da bekor.
  Haftalik chegara: o'sha haftada (dushanbadan yakshanbagacha) ilovaning ikkita eslatmasi bo'lsa (o'yin eslatmasi ham sanaladi) — qo'yilmaydi; qo'yilgan eslatmalar vaqti telefonda saqlanadi.
  Haftalik chegara kodda bor, telefonda tekshirilmagan (bir hafta kerak).
- **Eslatma sanog'i va o'chirgich** (9-dars) — ilovaning istalgan eslatmasi bosilib ilova ochilsa (fonda ham, butunlay yopiq bo'lsa ham) — sanoq yozuvi `eslatmadan-ochdi`
  (bitta bosishga bitta; bitta ochilish ikki yozuv beradi: `ochdi` va `eslatmadan-ochdi`). Sanoq sahifasida qadamlar ostida — «eslatmadan ochdi» (turli qurilmalar):
  bu son eslatma bosilganini aytadi, eslatmasiz ham ocharmidi — buni aytmaydi. «O'yinlar» tepasida «Eslatmalar» o'chirgichi (sukutda yoqiq, tanlov telefonda):
  o'chirilsa — hamma rejalashtirilgan eslatma bekor; yoqilsa — qo'shilgan, hali boshlanmagan o'yinlar va uch kunlik eslatma qaytadan.
  Telefonda ruxsat berilmagan bo'lsa — ostida «Telefon sozlamalarida eslatmalarga ruxsat berilmagan».

### Havolani ulashish (10-dars — Mentor zaxira rejasidagi ish)

Zaxira reja: bo'g'in — kanal (post faqat ikki joyga yetdi: 60 kishilik guruh va sinf chati); gipoteza — «Agar har o'yin e'loni bilan birga havola yuborilsa,
yangi odamlar keladi, chunki tashkilotchi o'z jamoasini o'zi chaqiradi»; ish — e'lon berilgach ilovada «Havolani ulashish» tugmasi (7-dars rejasining 3-bosqichi oldinga suriladi).
«O'yin» ekranida, o'yinni e'lon qilgan tashkilotchida: telefonning ulashish oynasi ochiladi — tashkilotchi o'zi tanlagan joyga yuboradi (ilova hech kimga o'zi yubormaydi).
Havola — lending manzili `?kanal=ilova` belgisi bilan (`mobil/src/lending.ts`): Umami'da `tashrif` hodisasi kanal bo'yicha ko'rinadi — gipoteza shu bilan tekshiriladi.
APK o'zi yangilanmaydi: tugma odamlarga yangi o'rnatish fayli va lendingdagi yangi havola bilan yetadi.

## Backend yo'llari

Yopiq yo'llar (`/oyinlar` va `/hisob`) — faqat token bilan (`Authorization: Bearer <token>`), tokensiz `401`.
Bitta istisno — mehmon ko'rinishi (12-Modul 8-dars): `GET /oyinlar` tokensiz ham javob beradi, faqat `id, kun, soat, maydon, kerak, qoshilgan`
(`men…` maydonlari, ism va login — yo'q). Yaroqsiz token yuborilsa — baribir `401`.

| Yo'l | Nima qiladi | Javoblar |
|---|---|---|
| `POST /royxat` `{ ism, login, parol }` | o'yinchi `oyinchilar` ga (`namuna = false`), parol — faqat hash (`parol_hash`); telefon so'ralmaydi | `201` · `400` bo'sh yoki login qoidaga mos emas · `409` «Bu login band» |
| `POST /kirish` `{ login, parol }` | token (30 kun) | `200 { token }` · `401` «Login yoki parol noto'g'ri» |
| `DELETE /hisob` | «Hisobni o'chirish»: akkaunt va uning `ishtirokchilar` dagi yozuvlari o'chadi; e'lon qilgan o'yinlari qoladi (tashkilotchisi bo'sh); qo'shilgan o'yinlarida navbatdagi kiradi | `200` |
| `POST /hodisalar` `{ nom, qurilma_id }` | qadamlar sanog'i (va 9-darsdan sanoq yozuvi `eslatmadan-ochdi`); token kerak emas (yuborilmaydi); yozilgach sanoq sahifalariga `sanoq-ozgardi` | `201` · `400` nom ruxsat etilganlardan emas |
| `GET /hodisalar/sanoq` (`?dan=` vaqt) | faqat maxfiy kalit bilan — sarlavha `X-Sanoq-Kaliti` (`SANOQ_KALITI`): `{ qadamlar: [{ nom, soni }], eslatmadanOchdi, royxatdanOtgan }` — har qadamda turli qurilmalar, ro'yxatdan o'tgan `namuna = false` akkauntlar; `?dan=` — shu vaqtdan keyingi yozuvlar | `200` · `401` kalitsiz yoki noto'g'ri |
| `GET /oyinlar` | yagona ro'yxat yo'li, eng yangi e'lon tepada: `id, kun, soat, maydon, kerak, qoshilgan, menQoshilganman, tasdiqlagan, menTasdiqlaganman, menTasdiqlayOlaman, navbatda, menNavbatdaman, menTashkilotchiman` | `200` |
| `POST /oyinlar` `{ kun, soat, maydon, kerak }` | e'lon; tashkilotchi — token egasi | `201` · `400` «Yozilmagan: …» |
| `POST /oyinlar/:id/qoshilish` | `qoshildi` | `201` · `409` «O'yin to'ldi» / «Siz bu o'yinga qo'shilgansiz» |
| `POST /oyinlar/:id/tasdiq` | `keladi` — faqat o'yin kuni (Toshkent vaqti) va qo'shilgan o'yinchiga | `201` · `403` «Tasdiq faqat o'yin kuni» / «Siz bu o'yinga qo'shilmagansiz» |
| `POST /oyinlar/:id/navbat` | `navbatda` — faqat to'lgan o'yinga | `201` · `409` |
| `POST /oyinlar/:id/chiqish` | `chiqdi`; qo'shilgan chiqsa — navbatdagi birinchi `qoshildi` | `201` · `409` |

## Sanoq — Neon SQL Editor (12-Modul 7-dars)

Namuna va tekshiruv akkauntlari sanalmaydi (`namuna = false`). Sinfdoshlar sanaladi, lekin alohida aytiladi — Database ularni ajratmaydi.

```sql
-- ro'yxatdan o'tganlar (hozirgacha)
SELECT COUNT(*) FROM oyinchilar WHERE namuna = false;

-- asosiy harakatni qilganlar: hozir kamida bitta o'yinda qatnashayotgan yoki o'yin e'lon qilgan
SELECT COUNT(*) FROM oyinchilar o WHERE o.namuna = false AND (EXISTS (SELECT 1 FROM ishtirokchilar i WHERE i.oyinchi_id = o.id AND i.holat IN ('qoshildi', 'keladi')) OR EXISTS (SELECT 1 FROM oyinlar g WHERE g.tashkilotchi_id = o.id));

-- qadamlar: har qadamda turli qurilmalar soni
SELECT nom, COUNT(DISTINCT qurilma_id) FROM hodisalar GROUP BY nom;
```

Tekshiruv yozuvlari (o'z qurilmangiz) — faqat `WHERE` bilan: `DELETE FROM hodisalar WHERE qurilma_id = '{qurilma ID}';`.

**Sanoq sahifasi** (8-dars) — `lending/sanoq.html` («Maydon Jamoa · sanoq»): avval maxfiy kalit (`SANOQ_KALITI`), keyin to'rt qadam va ro'yxatdan o'tgan akkauntlar.
Kalit faqat ochiq sahifa holatida — yangilansa, qayta so'raladi; kalitni bilgan har kim ochadi: chiqib ketsa — `.env` va Render'da yangisini qo'ying.
Sahifa o'zi yangilanadi: socket.io bilan kalitni yuborib ulanadi, Backend uni faqat `sanoq` xonasiga qo'shadi (o'yin xonalari va o'yin hodisalariga emas),
yangi qadam yozilganda `sanoq-ozgardi` — sahifa sonlarni qayta so'raydi. Lendingdan havola yo'q, Umami yo'q, faqat sonlar.
Sahifadagi `BACKEND` — namuna manzil, o'z Render manzilingizga almashtiring; Backend `WEB_ORIGIN` ida lending manzili bo'lsin.

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

`localhost:3000` → «Maydon Jamoa Backend ishlayapti»; `localhost:3000/oyinlar` → mehmon javobi (tokensiz: `id, kun, soat, maydon, kerak, qoshilgan`);
`localhost:3000/hodisalar/sanoq` → `401` (kalitsiz yopiq).
Birinchi ishga tushganda jadvallar o'zi yaratiladi va namuna qo'shiladi (bor bo'lsa — qayta qo'shilmaydi):
namuna tashkilotchi (login `namunatashkilotchi`) va to'rt o'yin — keyingi shanba va yakshanba (Toshkent vaqti):
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
Ilovada: «Ro'yxatdan o'tish» (Ism · Login · Parol, masalan `Ali` · `ali`; telefon so'ralmaydi) → «Kirish» (login va parol) → «O'yinlar».
Kirmagan odam (mehmon ko'rinishi) ham «O'yinlar»ni ko'radi — tepada «Kirish»; «Qo'shilaman» → «Ro'yxatdan o'tish»; ro'yxat ekran ochilganda va pastga tortganda yangilanadi.
«O'yinlar» sarlavhasi yonida (kirgan o'yinchida) — ulanish belgisi: «Ulangan» (Backend'ga doimiy ulangan) · «Ulanmoqda…» (ulanish yo'q, ilova o'zi urinmoqda — masalan, uchish rejimida) · «Ulanmagan» (ilova urinmayapti — token yaroqsiz yoki hisobdan chiqilgan).
Ikkinchi o'yinchini tekshirish: «Hisobdan chiqish» → boshqa login bilan ro'yxatdan o'ting (masalan `ali2`; login band bo'lsa — «Bu login band»).
Tekshiruv akkauntini o'chirish — ilovadagi «Hisobni o'chirish» («Rostdan o'chirasizmi?»).
«Kelaman» faqat o'yin kuni chiqadi: bugun o'yin bo'lmasa — bugungi sana bilan yangi e'lon bering va unga ikkinchi akkaunt bilan qo'shiling.

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
| `WEB_ORIGIN` | `backend/.env` · Render | brauzerdan so'rov va ulanishga ruxsat (CORS), bir nechta manzil — vergul bilan: web-trekda — sayt manzili; mobil trekda — ilovaning brauzer ko'rinishi (7-dars) va lending (sanoq sahifasi, 8-dars) |
| `SANOQ_KALITI` | `backend/.env` · Render | sanoq sahifasining maxfiy kaliti (12-Modul 8-dars) — maxfiy; yo'q bo'lsa sanoq hech kimga ochilmaydi |
| `EXPO_PUBLIC_API_URL` | `mobil/.env` | Backend manzili — maxfiy emas: `EXPO_PUBLIC_` qiymati ilova ichida ochiq ko'rinadi |

Web-trekda sayt Backend manzilini `VITE_API_URL` dan oladi (sayt papkasidagi `.env`; bu repo'dagi `prototip/` Backend'ga ulanmagan — mobil trek namunasi).
Token telefonda `expo-secure-store` da (qiymatni shifrlab saqlaydi); web-trekda va ilovaning brauzer ko'rinishida — `localStorage` (`mobil/src/saqlash.ts`).
Lending manzili ilovada — `mobil/src/lending.ts` (ochiq qiymat; namuna — o'zingiznikiga almashtiring): «Maxfiylik siyosati» havolasi shundan.

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
Tekshirish: `https://….onrender.com/hodisalar/sanoq` → `401` — Backend internetda, kalitsiz yopiq; `…/oyinlar` — mehmon javobi (ism, login va `men…` yo'q).
Environment ga `SANOQ_KALITI` ham (8-dars); brauzer ko'rinishi va lending bo'lsa — `WEB_ORIGIN` (vergul bilan).
Bepul Backend 15 daqiqa so'rovsiz qolsa uxlaydi — keyingi birinchi javob bir daqiqagacha kechikishi mumkin. Render bepul xizmatni prod uchun tavsiya qilmaydi.

Backend manzili: `https://maydon-jamoa-….onrender.com` (manzil — ochiq qiymat; ilovada — `mobil/.env` dagi `EXPO_PUBLIC_API_URL`).

## Ilovaning brauzer ko'rinishi (mobil trek, 12-Modul 7-dars)

iPhone'ga do'konsiz o'rnatish pullik Apple akkauntini talab qiladi — iPhone'li foydalanuvchi ilovaning brauzer ko'rinishini ochadi.
Unda token `localStorage` da, rejalashtirilgan eslatma yo'q (lendingda: «iPhone'da eslatma hozircha yo'q.»). `app.json` da `web.output` — `single` (bitta sahifali ilova),
`mobil/public/_redirects` — `/*    /index.html   200` (Netlify har manzilda ilovani ochadi).

```
cd mobil
npx expo export -p web
netlify deploy --prod --dir dist
```

`--prod` siz — sinov manzili chiqadi. Push'dan keyin o'zi yangilanmaydi — har yangi versiyada shu ikki buyruq.
Backend'da shu manzilga ruxsat: `WEB_ORIGIN` (HTTP so'rovlar ham, socket.io ulanishi ham).

## O'rnatish fayli — APK (mobil trek, 12-Modul 6–7-darslar)

APK — Android telefonga o'rnatiladigan ilova fayli; EAS Build tayyorlaydi (`mobil/` papkasida):

```
npm install --global eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

`mobil/eas.json` — `preview` profili: Android uchun `buildType` — `apk`; `env` da `EXPO_PUBLIC_API_URL` — Render'dagi Backend manzili
(`.env` fayli EAS'ga yuborilmaydi; bu qiymat maxfiy emas). Repo'dagi `https://maydon-jamoa-namuna.onrender.com` — namuna: o'z Render manzilingizga almashtiring.
`eas build:configure` `app.json` ga loyihangiz ID'sini (`extra.eas.projectId`), birinchi build esa Android paket nomini so'rab qo'shadi — ular har akkauntda o'ziniki, repo'da yo'q.
Kalitni (keystore) EAS o'zi yaratadi va saqlaydi. Tayyor bo'lgach — havola; o'rnatishda Android ogohlantirish ko'rsatadi: ilova do'kondan emas, to'g'ridan-to'g'ri o'rnatiladi.
Bepul hisobda oyiga 15 tagacha Android build, navbat sekin bo'lishi mumkin. **APK o'zi yangilanmaydi** — ilova o'zgarsa, yangi fayl tayyorlanadi va lendingdagi havola almashtiriladi.
6-dars uyga vazifasida — tekshiruv fayli: faqat o'z telefoningizga (unda hali telefon so'raydigan eski ro'yxatdan o'tish bor); odamlarga — 7-darsdan keyingi fayl.

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

## Lending (12-Modul 1-dars)

`lending/` — mahsulotni bitta sahifada tanishtiradigan sayt: oddiy HTML va CSS (`index.html`, `style.css`), yig'ish buyrug'i yo'q.
Sarlavha «Mahalla futboliga jamoani bir joyda yig'ing», uch foyda (foyda — katta yozuv, ostida funksiya qatori), asosiy tugma «Qo'shilmoqchiman» →
sahifa pastidagi «Qanday qo'shilaman» bo'limi («Hozircha o'rnatish havolasi yo'q.»). Telefon maketi — HTML va CSS bilan chizilgan, namuna o'yin «Shanba, 18:00 · Mahalla maydoni · 8 / 10».
Adaptiv: telefon kengligida bitta ustun. Sahifada forma yo'q — ism, telefon, email so'ralmaydi.

Laptopda: `lending/index.html` ni brauzerda oching. Netlify'da — alohida sayt (app.netlify.com → yangi loyiha → GitHub'dan import → shu repo):

| Sozlama | Qiymat |
|---|---|
| Base directory | bo'sh (repo ildizi) |
| Build command | bo'sh (yig'ish yo'q) |
| Publish directory | `lending` |

Havola — `https://maydon-jamoa-….netlify.app`; push'dan keyin sayt odatda o'zi yangilanadi.

7-darsdan: `lending/maxfiylik.html` — maxfiylik siyosati (qaysi ma'lumot · nima uchun · kim ko'radi · qancha saqlanadi; yuridik hujjat emas, har gap koddan tekshirilgan),
sahifa pastida «Maxfiylik siyosati» havolasi. «Qanday qo'shilaman» — ikki havola: «Android: ilovani o'rnatish» (APK) va «iPhone: brauzerda ochish» (brauzer ko'rinishi);
repo'dagi manzillar — namuna, o'zingiznikiga almashtiring. Ostida: «Android o'rnatishda ogohlantirish ko'rsatadi — ilova do'kondan emas, to'g'ridan-to'g'ri o'rnatiladi.» · «iPhone'da eslatma hozircha yo'q.»

O'lchov — Umami (1-dars uyga vazifasi): `<head>` dagi skript sahifa ochilishini sanaydi, tugma bosilishi — hodisa `qoshilmoqchiman`
(`data-umami-event`). `data-website-id` — namuna: cloud.umami.is → «Websites» → «Add website» (Domain — lending manzili) → «Edit» → «Tracking code» dagi ID bilan almashtiring.
Reklama to'sgichi yoqilgan brauzerda Umami yozmasligi mumkin.
Kanal belgisi (6-dars): postdagi havola oxirida — `?kanal=guruh` · `?kanal=sinf` · `?kanal=instagram`; sahifa ochilganda Umami'ga `tashrif` hodisasi,
ma'lumotida `kanal` (belgi bo'lmasa — `belgisiz`). Umami sahifa ochilishini o'zi ham sanaydi; kanal bo'yicha son — `tashrif` hodisasidan. Belgi tashrif qaysi kanaldan kelganini ko'rsatadi, odamni emas.

## Darslar va teglar

Teglar: `m11-dars-NN-start` — dars boshidagi holat, `m11-dars-NN-done` — dars oxiridagi holat.
`m11-dars-07-start` — boshlang'ich holat (`main`: shu README va `.gitignore`); keyingi dars boshi — oldingi dars oxiri
(`m11-dars-08-start` = `m11-dars-07-done` va hokazo). Yechim commitlari — `yechim` tarmog'ida.
Kod yoziladigan darslar: 7, 8, 9, 10, 11, 12, 13, 14.

`m11-dars-07-start` · `m11-dars-07-done` · `m11-dars-08-start` · `m11-dars-08-done` · `m11-dars-09-start` · `m11-dars-09-done` ·
`m11-dars-10-start` · `m11-dars-10-done` · `m11-dars-11-start` · `m11-dars-11-done` · `m11-dars-12-start` · `m11-dars-12-done` ·
`m11-dars-13-start` · `m11-dars-13-done` · `m11-dars-14-start` · `m11-dars-14-done`

| Teg | Dars | Nima bor |
|---|---|---|
| `m11-dars-07-done` | 7 · jonli prototip | `PRD.md` (5-darsdan), `wireframe.jpg`; `prototip/` (React + Vite + `motion`): uch ekran — O'yinlar · O'yin · E'lon berish, namuna ma'lumot `prototip/src/namuna.js` (4 o'yin, Shanba va Yakshanba); uch animatsiya — karta kichrayib qaytadi, «8 / 10» dagi son kattalashib qaytadi, ekranlar Motion bilan almashadi; `README.md` — talab va wireframe surati |
| `m11-dars-08-done` | 8 · arxitektura va platforma | `README.md` «Arxitektura» bo'limi: chizma (ilova · Backend · Database), uch jadval (`oyinchilar` · `oyinlar` · `ishtirokchilar`) va bog'lovchi ustunlar, real vaqt nuqtalari, platforma (mobil) va bir gapli asos, stek; kod o'zgarmagan |
| `m11-dars-09-done` | 9 · telefonda | `mobil/` (Expo, `npx create-expo-app@latest mobil`; Expo Router, TypeScript): `src/app/_layout.tsx` — `<Stack />`, `index.tsx` — O'yinlar, `oyin/[id].tsx` — O'yin (to'rt o'yin bitta faylda, `id` manzildan), `elon.tsx` — E'lon berish; namuna ma'lumot `mobil/src/namuna.ts` (prototipdagidek, `id` '1'…'4'); karta kichrayib qaytadi, son kattalashib qaytadi; shablondagi `explore` va pastki tablar olib tashlangan. Web-trek namunasi: `prototip/` adaptiv (600 px dan tor oynada bitta ustun) va PWA — `public/manifest.webmanifest`, `ikonka-192.png`, `ikonka-512.png` |
| `m11-dars-10-done` | 10 · poydevor | `backend/` (NestJS + TypeORM, Database — Neon): jadvallar `oyinchilar` · `oyinlar` · `ishtirokchilar` (README'dagidek); `POST /royxat` (`ism`, `telefon`, `parol` → parolning faqat hash'i, telefon takrorlansa `409` «Bu telefon ro'yxatdan o'tgan»), `POST /kirish` (`telefon`, `parol` → token, 30 kun), `GET /oyinlar` — faqat token bilan (tokensiz `401`), eng yangisi tepada (`yaratilgan` bo'yicha kamayib); namuna tashkilotchi va to'rt o'yin; port — `PORT` yoki 3000; README «Internetga chiqarish» (Render). `mobil/`: «Ro'yxatdan o'tish» (`royxat.tsx`) va «Kirish» (`kirish.tsx`), token `expo-secure-store` da, Backend manzili — `EXPO_PUBLIC_API_URL`; «O'yinlar» Backend'dan («N kishi kerak»), `401` da token o'chadi va «Kirish» ochiladi, «Hisobdan chiqish». «O'yin» va «E'lon berish» hali namuna ma'lumotda |
| `m11-dars-11-done` | 11 · 1-asosiy funksiya: o'yin e'loni va qo'shilish | `POST /oyinlar` (`kun`, `soat`, `maydon`, `kerak`; tashkilotchi — token egasi, formada «kim» yo'q; bo'sh maydon bo'lsa `400` «Yozilmagan: …»; yangi e'lon «0 / N»); `POST /oyinlar/:id/qoshilish` → `ishtirokchilar` ga `qoshildi` (to'lgan o'yinda `409` «O'yin to'ldi», takror — `409` «Siz bu o'yinga qo'shilgansiz»; (`oyin_id`, `oyinchi_id`) — Database kaliti); `GET /oyinlar` da `qoshilgan` (`qoshildi` + `keladi`) va `menQoshilganman`; namuna: 9 ta namuna o'yinchi (`+998 90 000 00 11` … `19`), qo'shilganlar 8 · 6 · 4 · 9. Ilovada: «E'lon berish» Backend'ga (kun — bugundan 7 kun ichidan), «8 / 10» Backend'dan, «Qo'shilaman» → «Qo'shildingiz», ekran ochilganda va pastga tortilganda qayta so'raladi, to'lgan o'yin kartasida «to'ldi», «O'yin» ekranida «O'yin to'ldi» |
| `m11-dars-12-done` | 12 · 2-asosiy funksiya: o'yin kuni tasdiq | `POST /oyinlar/:id/tasdiq` → holat `keladi`; ruxsatni Backend beradi: faqat o'yin kuni («bugun» — Toshkent vaqti) va faqat qo'shilgan o'yinchiga, aks holda `403` «Tasdiq faqat o'yin kuni» yoki «Siz bu o'yinga qo'shilmagansiz» (tokensiz `401`); `GET /oyinlar` da `tasdiqlagan` (faqat o'yinni e'lon qilganga, boshqalarga `null`), `menTasdiqlaganman`, `menTasdiqlayOlaman` (…/tasdiq dagi o'sha qoida). Ilovada: «Kelaman» faqat ruxsat bor joyda → «Tasdiqladingiz» (qayta ochilganda ham); tashkilotchida «Kelishini tasdiqladi: 7 / 9», tasdiqlaganlar doirasi yashil ✓ — ekran ochilganda va pastga tortilganda |
| `m11-dars-13-done` | 13 · sinov tuzatishi | sinovdagi eng muhim to'xtash (3 kishidan 3 tasi Shanba 18:00 dagi o'yinni topishda to'xtadi) tuzatilgan: «O'yinlar» kun va soat bo'yicha, har kun o'z sarlavhasi bilan — faqat ilovada (`mobil/src/app/index.tsx`), `GET /oyinlar` tartibi o'zgarmagan; `SINOV.md` — vazifa, «Vazifani bajardi: 2 / 3», to'xtashlar jadvali (tuzatildi · keyin) va qayta sinov |
| `m11-dars-14-done` | 14 · 3-asosiy funksiya: chiqish va navbat | `POST /oyinlar/:id/navbat` — faqat to'lgan o'yinga (`navbatda`; to'lmagan bo'lsa `409`), `POST /oyinlar/:id/chiqish` — qo'shilgan yoki navbatdagi o'yinchi `chiqdi`; qo'shilgan chiqsa, navbatga birinchi yozilgan (`yaratilgan` bo'yicha) `qoshildi` bo'ladi; qo'shilish, navbat va chiqish — bitta ish (tranzaksiya, o'yin qatori qulflanadi): oxirgi joyga ikki so'rov bir lahzada kelsa ham bitta odam yoziladi, ikkinchisi kutadi va `409` «O'yin to'ldi» oladi; qayta yozilganda — o'sha bitta qator; `GET /oyinlar` da `navbatda`, `menNavbatdaman`. Ilovada: to'lgan o'yinda «Navbatga yozilish», «Navbatdasiz», «O'yindan chiqish» → «Rostdan chiqasizmi?» (Yo'q · Ha), kartada «Navbatda: N», «O'yin» ekranida ham pastga tortib yangilash |

### 12-Modul

Teglar: `m12-dars-NN-start` — dars boshidagi holat, `m12-dars-NN-done` — dars oxiridagi holat.
`m12-dars-01-start` = `m11-dars-14-done`; keyingi dars boshi — oldingi dars oxiri, bitta istisno: `m12-dars-05-start` — `m12-dars-04-done` ustiga README eslatmasi.
Repo'ga yoziladigan darslar: 1–10; 11 va 12 (pitch) — repo'ga yozmaydi, tegi yo'q.

| Teg | Dars | Nima bor |
|---|---|---|
| `m12-dars-01-done` | 1 · lending | `lending/index.html`, `lending/style.css` — sarlavha, sarlavha osti, uch foyda (foyda va funksiya qatori), asosiy tugma «Qo'shilmoqchiman» → «Qanday qo'shilaman» («Hozircha o'rnatish havolasi yo'q.»), telefon maketi (HTML va CSS), adaptiv — telefonda bitta ustun; forma yo'q. Uyga vazifadan: Umami skripti (`data-website-id` — namuna, o'z sayt ID'ingiz bilan almashtiriladi) va tugma hodisasi `qoshilmoqchiman`. Netlify: Base — bo'sh, Build — bo'sh, Publish — `lending` |
| `m12-dars-02-done` | 2 · WebSocket: doimiy ulanish | `backend/src/oyinlar.gateway.ts` — `OyinlarGateway` (`@nestjs/websockets`, `@nestjs/platform-socket.io`; HTTP bilan bitta port): token ulanish ochilayotganda tekshiriladi (`handshake.auth.token`), yo'q yoki yaroqsiz — ulanish yopiladi. `mobil/src/ulanish.ts` (`socket.io-client`): ilova token o'qilgach bir marta ulanadi (`auth: { token }`, manzil — `EXPO_PUBLIC_API_URL`), «Hisobdan chiqish»da yopiladi, qayta kirilganda yangi token bilan; «O'yinlar» tepasida belgi «Ulangan» · «Ulanmoqda…» · «Ulanmagan». `README.md` — «Real vaqt» (real vaqt oqimi sxemasi: besh qator, `oyin-ozgardi` · `{ oyinId, sabab }`), «Stek»: socket.io. Hodisalar hali yuborilmaydi |
| `m12-dars-03-done` | 3 · real vaqt talabi | Backend besh o'zgarishdan keyin (e'lon, qo'shilish, tasdiq, chiqish, navbat) — yozuv tugagach `oyin-ozgardi` `{ oyinId, sabab }` hamma ulangan ilovaga; ilova tinglaydi va `GET /oyinlar` ni bir marta qayta so'raydi — «O'yinlar» va «O'yin» bitta javobdan (`mobil/src/oyin.ts`), pastga tortmasdan; fondan qaytganda ham qayta so'raladi. «O'yinlar»da uch ulanish holati (belgi va kulrang qator). `README.md` «Real vaqt» — «Ulanish holatlari» va «Chekka holatlar» (uchta). Agent «uchala chekka holatni bajardim» degan — tekshirilmagan: buzib tekshirish 5-darsda |
| `m12-dars-04-done` | 4 · loyiha kuni: jonli xabar va eslatma | xona `oyin-{id}`: «O'yin» ochilganda `oyin-ochildi`, yopilganda `oyin-yopildi`; Backend xonaga `korayotganlar-ozgardi` `{ oyinId, soni }` (uzilganda ham) — «O'yin» ekranida «Hozir ko'ryapti: N». Jonli xabarlar (`mobil/src/ulanish.ts`, ko'rinishi `_layout.tsx`): hodisadan keyingi javob oldingisi bilan solishtiriladi; faqat o'ziga tegishli o'yin (`GET /oyinlar` ga `menTashkilotchiman`), o'z harakati uchun emas, ismsiz. Eslatma (`expo-notifications`, `oyin/[id].tsx`): «Qo'shilaman» → o'yindan bir soat oldin, chiqilganda bekor, bitta o'yinga bitta. Qayta ulanish maxsus boshqarilmaydi |
| `m12-dars-05-start` | 5 · boshlanish | `m12-dars-04-done` + `README.md` «Real vaqt» da eslatma: «bu holatda uch muammo bor — 5-darsda topiladi». Kod — agent «bajardim» deganidan keyingi holat (chekka holatlar tekshirilmagan) |
| `m12-dars-05-done` | 5 · buzamiz va tuzatamiz | uch muammo tuzatilgan (`mobil/src/ulanish.ts`, `src/app/oyin/[id].tsx`): qayta ulanganda ro'yxat qayta so'raladi · `oyin-ozgardi` tinglovchisi bir marta, `connect` dan tashqarida · qayta ulanganda ochiq o'yin xonasiga qayta kiradi. `BUZISH.md` — uch urinish (buzildi · buzilmadi · buzildi), tuzatish va qayta tekshiruv natijasi; README eslatmasi o'rnida — tuzatilganlar |
| `m12-dars-06-done` | 6 · kanallar va birinchi post | `lending/index.html`: havoladagi kanal belgisi (`?kanal=guruh` · `sinf` · `instagram`; `URLSearchParams`) o'qiladi — Umami'ga `tashrif` hodisasi `{ kanal }`, belgi bo'lmasa `belgisiz`. Uyga vazifadan (mobil trek): `mobil/eas.json` — `preview` profili (Android `buildType: apk`, `env.EXPO_PUBLIC_API_URL` — namuna manzil); README «O'rnatish fayli — APK» |
| `m12-dars-07-done` | 7 · 50 foydalanuvchiga reja va ishga tushirish | `oyinchilar`: `telefon` → `login` (3–20 harf va raqam, «Bu login band»), `namuna`, `yaratilgan`; bir martalik migratsiya (`backend/src/migratsiya.ts`: mavjud akkauntlar ismidan namuna login oladi, `namuna = true`, `telefon` ustuni olib tashlanadi); `POST /royxat { ism, login, parol }`, `POST /kirish { login, parol }`; `DELETE /hisob` — «Hisobni o'chirish» («Rostdan o'chirasizmi?»; e'lon qilgan o'yinlar qoladi — tashkilotchisi bo'sh; «Hisobdan chiqish» va «Hisobni o'chirish»da eslatmalar bekor); `hodisalar` jadvali, `POST /hodisalar`, `hodisaYoz` to'rt joyda (qurilma ID; 60 kun). Forma ostida gap va «Maxfiylik siyosati». `lending/maxfiylik.html` (to'rt savol), lendingda ikki havola (manzillar — namuna). Brauzer ko'rinishi: token `localStorage` da, eslatma yo'q, `app.json` `web.output: single`, `public/_redirects`; socket.io ham `WEB_ORIGIN` ga ruxsat. README — sanoq SQL |
| `m12-dars-08-done` | 8 · qadamlar bo'yicha sanoq va tuzatish | `GET /hodisalar/sanoq` — faqat maxfiy kalit bilan (sarlavha `X-Sanoq-Kaliti` = `SANOQ_KALITI`, aks holda `401`): to'rt qadam — turli qurilmalar soni, ro'yxatdan o'tgan `namuna = false` akkauntlar, `?dan=`; `lending/sanoq.html` — kalit faqat sahifa holatida, o'zi yangilanadi (socket.io: kalit bilan faqat `sanoq` xonasiga, `POST /hodisalar` dan keyin `sanoq-ozgardi`); `oyin-ozgardi` — faqat ilova ulanishlariga; `WEB_ORIGIN` — bir nechta manzil (vergul). Tuzatish — mehmon ko'rinishi: `GET /oyinlar` tokensiz ham (faqat `id, kun, soat, maydon, kerak, qoshilgan`); ilova kirmagan odamga «O'yinlar»ni tepada «Kirish» bilan ko'rsatadi, «Qo'shilaman» → «Ro'yxatdan o'tish», real vaqt ulanishi — faqat kirganlarga |
| `m12-dars-09-done` | 9 · loyiha kuni: qaytaradigan eslatma | jonli xabar «Shanba, 18:00 — 2 joy qoldi» (o'zi qo'shilmagan o'yinda bir yoki ikki joy, yangi hodisasiz, bir xil son uchun bir marta); uch kunlik eslatma (`mobil/src/eslatma.ts`: ilova ochilganda oldingisi bekor, uch kundan keyin 17:00 «Hafta oxiriga o'yin bormi? E'lonlarni ko'ring»; faqat kirganga; haftalik chegara — ikkita); `eslatmadan-ochdi` (istalgan eslatma bosilib ochilganda, bitta bosishga bitta) — `POST /hodisalar` qabul qiladi, `GET /hodisalar/sanoq` da `eslatmadanOchdi`, sanoq sahifasida yangi qator; «Eslatmalar» o'chirgichi (ruxsat yo'q bo'lsa — qator); maxfiylik: «Ilova eslatmadan ochilgani ham qurilma ID bilan sanaladi.» |
| `m12-dars-10-done` | 10 · uyga vazifa (Mentor misoli): zaxira rejadagi ish | «O'yin» ekranida, o'yinni e'lon qilgan tashkilotchida — «Havolani ulashish»: telefonning ulashish oynasi, xabarda o'yin (kun, soat, maydon) va lending havolasi `?kanal=ilova` (`mobil/src/lending.ts`); README — zaxira reja va tugma. 12-dars jonli demosi shu tegdan. Metrika hisoboti, Mentor tekshiruvi va SQL so'rovlari — darsda (Neon SQL Editor), repo'ga yozilmaydi |

## Ortda qoldingizmi

```
git clone https://github.com/Azizbekcrypto/maydon-jamoa
cd maydon-jamoa
git checkout -f m11-dars-NN-done
```

Mentor misolini alohida papkada ochib, qanday ishlashini ko'rasiz; o'z repo'ngizdagi qadamni shunga qarab qaytarasiz.
`-f` shu papkadagi o'zgarishlarni o'chiradi.
