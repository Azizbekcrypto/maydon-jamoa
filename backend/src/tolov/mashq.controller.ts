import { BadRequestException, Body, Controller, Get, Header, HttpCode, Post, Query } from '@nestjs/common';
import { imzola } from './imzo.js';

// «Mashq to'lov» (13-Modul 3-dars) — Backend'ning o'zi beradigan oddiy HTML sahifa: to'lov xizmatining o'rnida, test rejimda.
// Karta yoki boshqa to'lov ma'lumoti so'ralmaydi, pul yechilmaydi; Payme yoki Click nomi va ko'rinishi ishlatilmaydi.
// Sahifa faqat qaysi tugma bosilganini aytadi — xabarni Backend yasaydi va imzolaydi: kalit (TOLOV_KALITI) brauzerga chiqmaydi.
// Mashq yordamchisi: hisob va summa manzildan olinadi (haqiqiy to'lovda ularni Backend o'zi biladi).

const TURLAR = ['tolash', 'rad', 'ikki', 'imzosiz'] as const;
type Tur = (typeof TURLAR)[number];

// Xabar yuboriladigan manzil — Backend'ning o'z ochiq manzili: Render'da RENDER_EXTERNAL_URL (Render o'zi beradi), laptopda — localhost
function ozManzil(): string {
  return (process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/+$/, '');
}

function musbatSon(q: unknown): number | null {
  const n = Number(q);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// 10000 → «10 000»
const somda = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

@Controller('tolov-mashq')
export class MashqTolovController {
  // GET /tolov-mashq?oyinchi=7&summa=10000 — sahifa
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  sahifa(@Query('oyinchi') oyinchiQ?: string, @Query('summa') summaQ?: string): string {
    const oyinchi = musbatSon(oyinchiQ);
    const summa = musbatSon(summaQ);
    if (!oyinchi || !summa) {
      return qolip(`<p class="xato">Manzilda hisob va summa bo'lsin: /tolov-mashq?oyinchi=7&amp;summa=10000</p>`, '');
    }
    const tugmalar = `
      <p class="nima"><b>Maydon Jamoa</b> — Pro, 30 kun · ${somda(summa)} so'm</p>
      <div class="tugmalar">
        <button data-tur="tolash">To'lash (mashq)</button>
        <button data-tur="rad" class="ikkinchi">Rad etish (mashq)</button>
      </div>
      <p class="kulrang">Tekshiruv tugmalari</p>
      <div class="tugmalar">
        <button data-tur="ikki" class="ikkinchi">Ikki marta yuborish</button>
        <button data-tur="imzosiz" class="ikkinchi">Imzosiz yuborish</button>
      </div>
      <ol id="javoblar"></ol>`;
    return qolip(tugmalar, `const MASHQ = ${JSON.stringify({ oyinchi, summa })};`);
  }

  // POST /tolov-mashq/yubor { tur, oyinchi, summa } → { tolovRaqami, javoblar: [{ holat, tana }] }
  // Har bosishda yangi to'lov raqami (m- va navbatdagi raqam). Xabar — bitta JSON satr; aynan shu satr TOLOV_KALITI bilan
  // imzolanadi va aynan shu satr tana bo'lib Backend'ning o'z POST /tolov/webhook manziliga haqiqiy so'rov bilan yuboriladi.
  // ikki — bir xil tana va imzo bilan ketma-ket ikki marta · imzosiz — X-Imzo sarlavhasisiz.
  @Post('yubor')
  @HttpCode(200)
  async yubor(@Body() body: Record<string, unknown>) {
    const tur = body?.tur as Tur;
    const oyinchi = musbatSon(body?.oyinchi);
    const summa = musbatSon(body?.summa);
    if (!TURLAR.includes(tur) || !oyinchi || !summa) throw new BadRequestException('tur, oyinchi va summa kerak');

    const tolovRaqami = `m-${Date.now()}`;
    const xabar = JSON.stringify({ tolovRaqami, holat: tur === 'rad' ? 'rad' : 'tolandi', summa, oyinchiId: oyinchi });
    const sarlavhalar: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tur !== 'imzosiz') sarlavhalar['X-Imzo'] = imzola(xabar, process.env.TOLOV_KALITI ?? '');

    const javoblar: { holat: number; tana: unknown }[] = [];
    for (let i = 0; i < (tur === 'ikki' ? 2 : 1); i++) {
      const javob = await fetch(`${ozManzil()}/tolov/webhook`, { method: 'POST', headers: sarlavhalar, body: xabar });
      const matn = await javob.text();
      let tana: unknown = matn;
      try {
        tana = JSON.parse(matn);
      } catch {
        // matn bo'lib qoladi
      }
      javoblar.push({ holat: javob.status, tana });
    }
    return { tolovRaqami, javoblar };
  }
}

// Sahifa qolipi: sarlavha, test rejim qatori, ichi va tugmalar skripti (har yuborishning javobi — holat kodi va tanasi)
function qolip(ichi: string, malumot: string): string {
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mashq to'lov</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px 20px; color: #1D2329; max-width: 480px; }
  h1 { font-size: 26px; margin: 0 0 6px; }
  .test { color: #6B7580; margin: 0 0 18px; }
  .nima { font-size: 17px; margin: 0 0 16px; }
  .nima b { color: #2E9E4F; }
  .tugmalar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  button { font: inherit; font-weight: 600; padding: 12px 16px; border-radius: 12px; border: 1px solid #2E9E4F;
    background: #2E9E4F; color: #fff; cursor: pointer; }
  button.ikkinchi { background: #fff; color: #2E9E4F; }
  button:disabled { opacity: .5; }
  .kulrang { color: #6B7580; font-size: 14px; margin: 8px 0; }
  #javoblar { padding-left: 20px; font-family: ui-monospace, monospace; font-size: 14px; }
  .xato { color: #C0392B; }
</style>
</head>
<body>
<h1>Mashq to'lov</h1>
<p class="test">Bu sahifa — mashq. Karta so'ralmaydi, pul yechilmaydi.</p>
${ichi}
<script>
${malumot}
document.querySelectorAll('button[data-tur]').forEach(function (t) {
  t.addEventListener('click', async function () {
    var tugmalar = document.querySelectorAll('button[data-tur]');
    tugmalar.forEach(function (b) { b.disabled = true; });
    var ro = document.getElementById('javoblar');
    try {
      var javob = await fetch('/tolov-mashq/yubor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tur: t.dataset.tur, oyinchi: MASHQ.oyinchi, summa: MASHQ.summa })
      });
      var j = await javob.json();
      (j.javoblar || [{ holat: javob.status, tana: j }]).forEach(function (x) {
        var li = document.createElement('li');
        li.textContent = t.textContent + ' · ' + (j.tolovRaqami || '') + ' — ' + x.holat + ' ' + JSON.stringify(x.tana);
        ro.appendChild(li);
      });
    } catch (e) {
      var li = document.createElement('li');
      li.className = 'xato';
      li.textContent = t.textContent + ' — javob kelmadi';
      ro.appendChild(li);
    }
    tugmalar.forEach(function (b) { b.disabled = false; });
  });
});
</script>
</body>
</html>`;
}
