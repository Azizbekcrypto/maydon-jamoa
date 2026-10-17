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

## Ishga tushirish

Prototip (brauzerda; telefon ko'rinishi — F12, keyin Ctrl+Shift+M):

```
cd prototip
npm install
npm run dev
```

`localhost:5173` → «Maydon Jamoa», O'yinlar — to'rt o'yin kartasi.

## Darslar va teglar

Teglar: `m11-dars-NN-start` — dars boshidagi holat, `m11-dars-NN-done` — dars oxiridagi holat.
`m11-dars-07-start` — boshlang'ich holat (`main`); keyingi dars boshi — oldingi dars oxiri. Yechim commitlari — `yechim` tarmog'ida.

| Teg | Dars | Nima bor |
|---|---|---|
| `m11-dars-07-done` | 7 · jonli prototip | `PRD.md` (5-darsdan), `wireframe.jpg`; `prototip/` (React + Vite + `motion`): uch ekran — O'yinlar · O'yin · E'lon berish, namuna ma'lumot `prototip/src/namuna.js` (4 o'yin, Shanba va Yakshanba); uch animatsiya — karta kichrayib qaytadi, «8 / 10» dagi son kattalashib qaytadi, ekranlar Motion bilan almashadi; `README.md` — talab va wireframe surati |
| `m11-dars-08-done` | 8 · arxitektura va platforma | `README.md` «Arxitektura» bo'limi: chizma (ilova · Backend · Database), uch jadval (`oyinchilar` · `oyinlar` · `ishtirokchilar`) va bog'lovchi ustunlar, real vaqt nuqtalari, platforma (mobil) va bir gapli asos, stek; kod o'zgarmagan |

## Ortda qoldingizmi

```
git clone https://github.com/Azizbekcrypto/maydon-jamoa
cd maydon-jamoa
git checkout -f m11-dars-NN-done
```

Mentor misolini alohida papkada ochib, qanday ishlashini ko'rasiz; o'z repo'ngizdagi qadamni shunga qarab qaytarasiz.
`-f` shu papkadagi o'zgarishlarni o'chiradi.
