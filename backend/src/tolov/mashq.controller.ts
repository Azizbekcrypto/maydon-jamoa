import { BadRequestException, Body, Controller, Get, Header, HttpCode, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoshlanganTolov } from './boshlangan-tolov.entity.js';
import { imzola } from './imzo.js';
import { ozManzil } from './manzil.js';

// «Mashq to'lov» (13-Modul 3-dars) — Backend'ning o'zi beradigan oddiy HTML sahifa: to'lov xizmatining o'rnida, test rejimda.
// Karta yoki boshqa to'lov ma'lumoti so'ralmaydi, pul yechilmaydi; Payme yoki Click nomi va ko'rinishi ishlatilmaydi.
// Sahifa faqat qaysi tugma bosilganini aytadi — xabarni Backend yasaydi va imzolaydi: kalit (TOLOV_KALITI) brauzerga chiqmaydi.
// 4-darsdan sahifa faqat Backend bergan to'lov raqami bilan ishlaydi (POST /tolov/boshlash): hisob va summa raqamdan olinadi,
// to'rt tugma yangi raqam yaratmaydi — shu raqam bilan ishlaydi. Raqam yo'q yoki noma'lum — «To'lov topilmadi.»

const TURLAR = ['tolash', 'rad', 'ikki', 'imzosiz', 'kech', 'notogriImzo'] as const;
type Tur = (typeof TURLAR)[number];

// «Kechiktirib yuborish» (5-dars): uxlagan Backend o'rnida — xabar 70 soniya kutib yuboriladi
const KECH_SONIYA = 70;
// «Noto'g'ri imzo» (5-dars): xabar TOLOV_KALITI bilan emas, boshqa kalit bilan imzolanadi. Bu kalit maxfiy emas — ataylab noto'g'ri
const NOTOGRI_KALIT = 'bu-kalit-ataylab-notogri';
const kut = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 15000 → «15 000»
const somda = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

@Controller('tolov-mashq')
export class MashqTolovController {
  constructor(@InjectRepository(BoshlanganTolov) private readonly boshlanganlar: Repository<BoshlanganTolov>) {}

  private async topish(raqam: unknown): Promise<BoshlanganTolov | null> {
    if (typeof raqam !== 'string' || !/^m-[a-z0-9]{1,38}$/.test(raqam)) return null;
    return this.boshlanganlar.findOneBy({ tolov_raqami: raqam });
  }

  // GET /tolov-mashq?raqam=m-… — sahifa
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async sahifa(@Query('raqam') raqam?: string): Promise<string> {
    const tolov = await this.topish(raqam);
    if (!tolov) return qolip(`<p class="xato">To'lov topilmadi.</p>`, '');
    const tugmalar = `
      <p class="nima"><b>Maydon Jamoa</b> — Pro, 30 kun · ${somda(tolov.summa)} so'm</p>
      <div class="tugmalar">
        <button data-tur="tolash">To'lash (mashq)</button>
        <button data-tur="rad" class="ikkinchi">Rad etish (mashq)</button>
      </div>
      <p id="natija"></p>
      <p class="kulrang">Tekshiruv tugmalari</p>
      <div class="tugmalar">
        <button data-tur="ikki" class="ikkinchi">Ikki marta yuborish</button>
        <button data-tur="imzosiz" class="ikkinchi">Imzosiz yuborish</button>
        <button data-tur="kech" class="ikkinchi">Kechiktirib yuborish</button>
        <button data-tur="notogriImzo" class="ikkinchi">Noto'g'ri imzo</button>
      </div>
      <ol id="javoblar"></ol>
      <p class="kulrang">Real ishga tushirish — ota-onaning yozma roziligi va yuridik shaxs yoki YaTT (yakka tartibdagi tadbirkor) bilan; bu kursda emas.</p>`;
    return qolip(tugmalar, `const MASHQ = ${JSON.stringify({ raqam: tolov.tolov_raqami })};`);
  }

  // POST /tolov-mashq/yubor { tur, raqam } → { tolovRaqami, javoblar: [{ holat, tana }] }
  // Xabar — bitta JSON satr { tolovRaqami, holat, summa, oyinchiId } (hisob va summa — boshlangan to'lovdan); aynan shu satr
  // TOLOV_KALITI bilan imzolanadi va aynan shu satr tana bo'lib Backend'ning o'z POST /tolov/webhook manziliga yuboriladi.
  // ikki — bir xil tana va imzo bilan ketma-ket ikki marta · imzosiz — X-Imzo sarlavhasisiz ·
  // kech — 70 soniya kutib yuboriladi (javob ham shundan keyin) · notogriImzo — boshqa kalit bilan imzolangan.
  @Post('yubor')
  @HttpCode(200)
  async yubor(@Body() body: Record<string, unknown>) {
    const tur = body?.tur as Tur;
    if (!TURLAR.includes(tur)) throw new BadRequestException('tur — tolash, rad, ikki yoki imzosiz');
    const tolov = await this.topish(body?.raqam);
    if (!tolov) throw new BadRequestException("To'lov topilmadi.");

    const xabar = JSON.stringify({
      tolovRaqami: tolov.tolov_raqami,
      holat: tur === 'rad' ? 'rad' : 'tolandi',
      summa: tolov.summa,
      oyinchiId: tolov.oyinchi_id,
    });
    const sarlavhalar: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tur === 'notogriImzo') sarlavhalar['X-Imzo'] = imzola(xabar, NOTOGRI_KALIT);
    else if (tur !== 'imzosiz') sarlavhalar['X-Imzo'] = imzola(xabar, process.env.TOLOV_KALITI ?? '');
    if (tur === 'kech') await kut(KECH_SONIYA * 1000);

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
    return { tolovRaqami: tolov.tolov_raqami, javoblar };
  }
}

// Sahifa qolipi: sarlavha, test rejim qatori, ichi va tugmalar skripti (har yuborishning javobi — holat kodi va tanasi).
// «To'lash (mashq)» va «Kechiktirib yuborish» javobi kelgach: { ok: true } — «To'lov o'tdi (mashq) — ilovaga qayting.», aks holda — «To'lov o'tmadi.»;
// «Rad etish (mashq)» — «To'lov o'tmadi.». Javob 10 soniyada kelmasa — «Javob kutilmoqda» (natijani ilova GET /men dan ko'radi).
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
  #natija { font-size: 18px; font-weight: 600; }
  #natija.otdi { color: #2E9E4F; }
  #natija.otmadi { color: #C0392B; }
  #natija.kutilmoqda { color: #1D2329; }
  .kulrang { color: #6B7580; font-size: 14px; margin: 8px 0; }
  #javoblar { padding-left: 20px; font-family: ui-monospace, monospace; font-size: 14px; }
  .xato { color: #C0392B; font-size: 18px; }
</style>
</head>
<body>
<h1>Mashq to'lov</h1>
<p class="test">Bu sahifa — mashq. Karta so'ralmaydi, pul yechilmaydi.</p>
${ichi}
<script>
${malumot}
function natija(matn, sinf) {
  var n = document.getElementById('natija');
  n.textContent = matn;
  n.className = sinf;
}
document.querySelectorAll('button[data-tur]').forEach(function (t) {
  t.addEventListener('click', async function () {
    var tur = t.dataset.tur;
    var tugmalar = document.querySelectorAll('button[data-tur]');
    tugmalar.forEach(function (b) { b.disabled = true; });
    var ro = document.getElementById('javoblar');
    try {
      var javob = await fetch('/tolov-mashq/yubor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tur: tur, raqam: MASHQ.raqam }),
        signal: AbortSignal.timeout(10000)
      });
      var j = await javob.json();
      var javoblar = j.javoblar || [{ holat: javob.status, tana: j }];
      javoblar.forEach(function (x) {
        var li = document.createElement('li');
        li.textContent = t.textContent + ' — ' + x.holat + ' ' + JSON.stringify(x.tana);
        ro.appendChild(li);
      });
      var birinchi = javoblar[0] || {};
      if (tur === 'tolash' || tur === 'kech') {
        if (birinchi.holat === 200 && birinchi.tana && birinchi.tana.ok) natija("To'lov o'tdi (mashq) — ilovaga qayting.", 'otdi');
        else natija("To'lov o'tmadi.", 'otmadi');
      }
      if (tur === 'rad') natija("To'lov o'tmadi.", 'otmadi');
    } catch (e) {
      // Javob 10 soniyada kelmadi — bu «o'tmadi» emas: xabar hali yo'lda bo'lishi mumkin (5-dars tuzatishi)
      if (tur === 'tolash' || tur === 'kech' || tur === 'rad') natija('Javob kutilmoqda', 'kutilmoqda');
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
