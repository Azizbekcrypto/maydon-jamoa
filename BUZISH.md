# Buzish yozuvi

Mahsulot: Maydon Jamoa (mobil trek, Expo Go). Talabdagi chekka holatlar — `README.md` «Real vaqt» → «Chekka holatlar».
Har urinish: nima qildim · nima kutdim · nima bo'ldi → belgi. Boshqa akkaunt — agent ochgan tekshiruv akkaunti (namuna ism va raqam, haqiqiy emas); ishdan keyin aytgan `id` lari bo'yicha o'chirildi.

| № | Usul | Nima qildim | Nima kutdim | Nima bo'ldi | Belgi | Tuzatish | Qayta tekshiruv |
|---|---|---|---|---|---|---|---|
| 1 | Internetni uzish | Uchish rejimini yoqdim; belgi «Ulanmoqda…» bo'lgach agent tekshiruv akkauntidan «Shanba, 18:00» ga qo'shildi; keyin uchish rejimini o'chirdim. | Belgi «Ulangan» bo'lgach, «9 / 10» ko'rinadi. | Belgi «Ulangan», lekin «8 / 10» qoldi. | buzildi | tuzatish qilindi | qayta tekshiruvda takrorlanmadi |
| 2 | Fonga olib qaytarish | Boshqa ilovaga o'tdim; shu payt agent tekshiruv akkauntidan qo'shildi; bir daqiqadan keyin qaytdim. | Qaytganimda «9 / 10» ko'rinadi. | Qaytganimda «9 / 10», belgi «Ulangan». | buzilmadi | — | — |
| 3 | Backend'ning yangi versiyasi | Render'da Backend'ni qayta chiqardim; belgi yana «Ulangan» bo'lgach, ikkinchi telefonda o'yinni ochdim va agent tekshiruv akkauntidan qo'shildi. | Bitta jonli xabar; ikkinchi telefonda «Hozir ko'ryapti: 2». | Jonli xabar ikki marta chiqdi; ikkinchi telefonda «Hozir ko'ryapti: 1». | buzildi | tuzatish qilindi | qayta tekshiruvda takrorlanmadi |

«buzilmadi» (2-urinish) — shu telefonda, shu urinishda.

## Topilgan muammolar va tuzatish

Tuzatish — `mobil/src/ulanish.ts` (va undan foydalanadigan `src/app/oyin/[id].tsx`); Backend o'zgarmagan.

1. **Uzilish paytidagi o'zgarish ko'rinmaydi** (1-urinish). Sabab: uzilish paytida yuborilgan hodisa qayta ulanganda kelmaydi.
   Tuzatish: qayta ulanganda (`connect`) ro'yxat qayta so'raladi.
2. **Qayta ulangandan keyin jonli xabar ikki marta chiqadi** (3-urinish). Sabab: `oyin-ozgardi` tinglovchisi `connect` ichida edi — har qayta ulanishda yana bittasi qo'shilardi.
   Tuzatish: tinglovchi bir marta, `connect` dan tashqarida qo'shiladi.
3. **Qayta ulangandan keyin «Hozir ko'ryapti» o'zini sanamaydi** (3-urinish). Sabab: ulanish uzilganda Backend uni xonadan chiqaradi, yangi ulanish xonaga qayta kirmagan edi.
   Tuzatish: qayta ulanganda ilova ochiq turgan o'yin xonasiga qayta kiradi (`oyin-ochildi`).

«Tuzatish qilindi» — kodda o'zgartirish qilindi (ish fakti). «Qayta tekshiruvda takrorlanmadi» — o'sha usul bilan qayta buzib ko'rilgan natija: shu telefonda, shu urinishda — hamma telefon uchun isbot emas.

## To'lov (13-Modul 5-dars)

Mahsulot: Maydon Jamoa (mobil trek, Expo Go). Holat — `m13-dars-05-start` va 5-darsning 1-amaliyoti (qolgan holatlar va ikki yangi tugma):
agent «to'lov ishlaydi» degan — bu da'vo. Buzish faqat o'z mahsulotida, «Mashq to'lov» tugmalari bilan; test rejim — pul yechilmaydi.
Har urinishdan oldin Pro yo'q edi (o'z hisobim, Neon: `UPDATE oyinchilar SET pro_gacha = NULL WHERE id = {hisob raqami};`).
«Talab bo'yicha» — 3, 4-darslar va 5-dars 1-amaliyot talabidan.

| № | Usul | Nima qildim | Nima kutdim | Nima bo'ldi | Belgi |
|---|---|---|---|---|---|
| 1 | Ikki marta yuborish | Pro yo'q edi. «To'lovga o'tish» ni, keyin sahifada «Ikki marta yuborish» ni bosdim; javoblarga va Neon'dagi to'lovlar bilan Pro muddatiga qaradim. | Ikki javob: `200 { ok: true }` va `200 { takror: true }`; `tolovlar` da bitta qator; Pro 30 kunga yoqiladi. | Javoblar va `tolovlar` kutgandek, lekin Pro muddati 60 kun bo'ldi. | buzildi |
| 2 | Kechiktirib yuborish | Pro yo'q edi. «To'lovga o'tish» ni, keyin «Kechiktirib yuborish» ni bosdim; sahifaga qaradim, keyin ilovaga qaytib, undan chiqmay bir daqiqa kutdim. | Sahifa natijani kutadi; xabar kelgach ilovada Pro ko'rinadi. | Sahifa 10 soniyadan keyin «To'lov o'tmadi» dedi. Bir daqiqadan keyin Neon'da Pro yozildi, ilovada esa «Javob kutilmoqda» qoldi. | buzildi |
| 3 | Rad etish | «To'lovga o'tish» ni, keyin «Rad etish (mashq)» ni bosdim va ilovaga qaytdim. | Sahifada «To'lov o'tmadi»; `tolovlar` da «rad» qatori; Pro yo'q; ilovada «To'lov o'tmadi — qayta urinib ko'ring». | Sahifada «To'lov o'tmadi», `tolovlar` da «rad» qatori, Pro yo'q, ilovada «To'lov o'tmadi — qayta urinib ko'ring». | buzilmadi |
| 4 | Noto'g'ri imzo | «To'lovga o'tish» ni, keyin «Noto'g'ri imzo» ni bosdim; sahifadagi javobga va Neon'ga qaradim. | Sahifada `401`; `tolovlar` da yangi qator yo'q; Pro yo'q. | Sahifada `401`, yangi qator yo'q, Pro yo'q. | buzilmadi |

«buzilmadi» (3, 4-urinish) — shu telefonda, shu urinishda. «buzilmadi» ham natija.
