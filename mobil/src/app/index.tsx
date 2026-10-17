import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora, tokenOchir, tokenOl } from '@/api';
import { BosiladiganKarta } from '@/components/bosiladigan-karta';
import { ESLATMA_BOR, eslatmalarniYoq, eslatmalarYoqiqmi, hammasiniBekor, ruxsatBormi } from '@/eslatma';
import { kunNomi } from '@/kun';
import { menniOl, menniUnut, useMen } from '@/men';
import { oyinlarniOl, useOyinlar, type Oyin } from '@/oyin';
import { R } from '@/ranglar';
import { tasdiqSora } from '@/tasdiq';
import { ulan, useUlanishHolati, uzil } from '@/ulanish';

// Sinov tuzatishi (13-dars): o'yinlar kun va soat bo'yicha, har kun o'z sarlavhasi bilan («Shanba», «Yakshanba»).
// Tartib faqat ilovada — GET /oyinlar o'z tartibida (eng yangi e'lon tepada) keladi.
function kunlarBoyicha(oyinlar: Oyin[]): { kun: string; oyinlar: Oyin[] }[] {
  const tartibli = [...oyinlar].sort((a, b) => a.kun.localeCompare(b.kun) || a.soat.localeCompare(b.soat));
  const guruhlar: { kun: string; oyinlar: Oyin[] }[] = [];
  for (const o of tartibli) {
    const oxirgi = guruhlar[guruhlar.length - 1];
    if (oxirgi?.kun === o.kun) oxirgi.oyinlar.push(o);
    else guruhlar.push({ kun: o.kun, oyinlar: [o] });
  }
  return guruhlar;
}

// O'yinlar: ro'yxat Backend'dan (GET /oyinlar). To'lgan o'yinda son yonida «to'ldi».
// Mehmon ko'rinishi (12-Modul 8-dars): token yo'q bo'lsa ham ilova birinchi ekranda «O'yinlar»ni ko'rsatadi, tepada «Kirish»;
// kirmagan odamga ro'yxat ekran ochilganda va pastga tortganda yangilanadi — real vaqt ulanishi faqat kirganlarga.
// «8 / 10» — real vaqt nuqtasi: ekran ochilganda, pastga tortib yangilaganda, oyin-ozgardi hodisasidan keyin va
// qayta ulanganda (uzilish paytidagi hodisa kelmaydi) — ulanish.ts qayta so'raydi, ro'yxat shu javobdan o'zi yangilanadi.
// Token o'qilgach ilova Backend'ga doimiy ulanadi; sarlavha yonida — ulanish belgisi.
export default function Oyinlar() {
  const router = useRouter();
  const oyinlar = useOyinlar();
  const [xato, setXato] = useState('');
  const [tortildi, setTortildi] = useState(false);
  const [mehmon, setMehmon] = useState(false);

  const yukla = useCallback(async () => {
    const token = await tokenOl();
    setMehmon(!token);
    // Ulanish — faqat kirganlarga; bor bo'lsa qayta ochilmaydi (ekran necha marta ochilsa ham bitta)
    if (token) ulan();
    // Telegram holati (8-dars) — GET /men
    if (token) menniOl().catch(() => {});
    try {
      await oyinlarniOl();
      setXato('');
    } catch (e) {
      setXato((e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      yukla();
    }, [yukla]),
  );

  async function tort() {
    setTortildi(true);
    await yukla();
    setTortildi(false);
  }

  // «Hisobdan chiqish»: ulanish yopiladi, token o'chadi, shu telefondagi rejalashtirilgan eslatmalar bekor bo'ladi
  async function hisobdanChiq() {
    uzil();
    await hammasiniBekor().catch(() => {});
    await tokenOchir();
    menniUnut();
    router.replace('/kirish');
  }

  // «Hisobni o'chirish» → «Rostdan o'chirasizmi?» → DELETE /hisob: akkaunt va qatnashuv yozuvlari o'chadi
  // (e'lon qilgan o'yinlar qoladi — tashkilotchisi bo'sh); keyin — xuddi «Hisobdan chiqish».
  function hisobniOchir() {
    tasdiqSora("Rostdan o'chirasizmi?", async () => {
      try {
        await sora('/hisob', { method: 'DELETE' });
        await hisobdanChiq();
      } catch (e) {
        setXato((e as Error).message);
      }
    });
  }

  return (
    <SafeAreaView style={s.ekran}>
      <View style={s.tepa}>
        <Text style={s.nom}>Maydon Jamoa</Text>
        {mehmon ? (
          <Pressable onPress={() => router.push('/kirish')}>
            <Text style={s.kirish}>Kirish</Text>
          </Pressable>
        ) : (
          <View style={s.hisobTugmalar}>
            <Pressable onPress={hisobdanChiq}>
              <Text style={s.chiqish}>Hisobdan chiqish</Text>
            </Pressable>
            <Pressable onPress={hisobniOchir}>
              <Text style={s.ochirish}>Hisobni o'chirish</Text>
            </Pressable>
          </View>
        )}
      </View>
      {!mehmon && ESLATMA_BOR && <EslatmalarOchirgichi oyinlar={oyinlar} />}
      {!mehmon && <TelegramQatori />}
      <ScrollView
        contentContainerStyle={s.ichi}
        refreshControl={<RefreshControl refreshing={tortildi} onRefresh={tort} tintColor={R.yashil} colors={[R.yashil]} />}>
        <View style={s.sarlavhaQator}>
          <Text style={s.sarlavha}>O'yinlar</Text>
          {!mehmon && <UlanishBelgisi />}
        </View>
        {!mehmon && <UlanishIzohi />}
        {/* Joy egallovchi (14-Modul 4-dars): ro'yxat yuklanayotganda ikkita kulrang karta — o'yin kartasi o'lchamida, harakatsiz;
            ostida kutish yozuvi (11-Modul 15-dars): bepul Backend uxlagan bo'lsa birinchi javob bir daqiqagacha keladi */}
        {!oyinlar && !xato && (
          <View style={s.oyinlar}>
            <KulrangKarta />
            <KulrangKarta />
            <Text style={s.kutishMatn}>O'yinlar yuklanmoqda — bu bir daqiqagacha cho'zilishi mumkin.</Text>
          </View>
        )}
        {!!xato && <Text style={s.xato}>O'yinlarni yuklab bo'lmadi: {xato}</Text>}
        {kunlarBoyicha(oyinlar ?? []).map((guruh) => (
          <View key={guruh.kun} style={s.kunGuruhi}>
            <Text style={s.kunSarlavha}>{kunNomi(guruh.kun)}</Text>
            <View style={s.oyinlar}>
              {guruh.oyinlar.map((o) => (
                <BosiladiganKarta key={o.id} style={s.karta} onPress={() => router.push(`/oyin/${o.id}`)}>
                  <Text style={s.vaqt}>{o.soat}</Text>
                  <Text style={s.maydon}>{o.maydon}</Text>
                  <Text style={s.hisob}>
                    {o.qoshilgan} / {o.kerak}
                    {o.qoshilgan >= o.kerak && <Text style={s.toldi}> · to'ldi</Text>}
                  </Text>
                  {o.navbatda > 0 && <Text style={s.maydon}>Navbatda: {o.navbatda}</Text>}
                </BosiladiganKarta>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <Pressable style={s.tugma} onPress={() => router.push(mehmon ? '/royxat' : '/elon')}>
        <Text style={s.tugmaMatn}>E'lon berish</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Joy egallovchi karta: o'yin kartasi bilan bir xil ramka va o'lcham; soat, maydon va «8 / 10» o'rnida kulrang chiziqlar
function KulrangKarta() {
  return (
    <View style={s.karta}>
      <View style={[s.chiziq, s.chiziqVaqt]} />
      <View style={[s.chiziq, s.chiziqMaydon]} />
      <View style={[s.chiziq, s.chiziqHisob]} />
    </View>
  );
}

// Ulanish belgisi: «Ulangan» (yashil nuqta) · «Ulanmoqda…» · «Ulanmagan» (kulrang)
const BELGI = {
  ulangan: { matn: 'Ulangan', rang: R.yashil },
  ulanmoqda: { matn: 'Ulanmoqda…', rang: '#D08A1E' },
  ulanmagan: { matn: 'Ulanmagan', rang: R.kulrang },
} as const;

// «Eslatmalar» o'chirgichi (9-dars) — sozlama, «Hisobdan chiqish» yonida; sukutda yoqiq, tanlov telefonda saqlanadi.
// O'chirilsa — rejalashtirilgan hamma eslatma bekor, yangisi qo'yilmaydi; yoqilsa — hozirgi ma'lumotdan qaytadan.
// Ilova o'chirgichi va telefon ruxsati — ikki alohida holat: ruxsat yo'q bo'lsa — ostida qator.
function EslatmalarOchirgichi({ oyinlar }: { oyinlar: Oyin[] | null }) {
  const [yoqiq, setYoqiq] = useState(true);
  const [ruxsat, setRuxsat] = useState(true);

  useFocusEffect(
    useCallback(() => {
      eslatmalarYoqiqmi().then(setYoqiq);
      ruxsatBormi().then(setRuxsat);
    }, []),
  );

  function almashtir(yangi: boolean) {
    setYoqiq(yangi);
    eslatmalarniYoq(yangi, oyinlar)
      .then(() => ruxsatBormi().then(setRuxsat))
      .catch(() => {});
  }

  return (
    <View style={s.sozlamaJoy}>
      <View style={s.sozlama}>
        <Text style={s.sozlamaMatn}>Eslatmalar</Text>
        <Switch value={yoqiq} onValueChange={almashtir} trackColor={{ true: R.yashil }} />
      </View>
      {!ruxsat && <Text style={s.ruxsat}>Telefon sozlamalarida eslatmalarga ruxsat berilmagan</Text>}
    </View>
  );
}

// «Telegram'da xabar olish» (13-Modul 8-dars) — sozlama qatori, «Hisobdan chiqish» yonida.
// Bosilganda POST /telegram/kod dan bir martalik havola (t.me/<bot>?start=<kod>) olinadi va Telegram'da ochiladi —
// o'yinchi botda «Start»ni o'zi bosadi. Ulangan bo'lsa — «Telegram ulangan» va «Telegram xabarlarini o'chirish».
// Ilovaga qaytganda holat GET /men dan qayta so'raladi.
function TelegramQatori() {
  const men = useMen();
  const [xato, setXato] = useState('');

  useFocusEffect(
    useCallback(() => {
      const obuna = AppState.addEventListener('change', (h) => {
        if (h === 'active') menniOl().catch(() => {});
      });
      return () => obuna.remove();
    }, []),
  );

  // «Telegram xabarlarini o'chirish» — so'rov oynasisiz, bir bosishda: chat raqami o'chadi, qator yana «Telegram'da xabar olish»
  async function ochir() {
    setXato('');
    try {
      await sora('/telegram', { method: 'DELETE' });
      await menniOl();
    } catch (e) {
      setXato((e as Error).message);
    }
  }

  async function ulash() {
    setXato('');
    try {
      const { havola } = await sora<{ havola: string }>('/telegram/kod', { method: 'POST' });
      await Linking.openURL(havola);
    } catch (e) {
      setXato((e as Error).message);
    }
  }

  return (
    <View style={s.sozlamaJoy}>
      {men?.telegram ? (
        <View style={s.sozlama}>
          <Text style={s.sozlamaMatn}>Telegram ulangan</Text>
          <Pressable onPress={ochir}>
            <Text style={s.telegramOchir}>Telegram xabarlarini o'chirish</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={ulash} style={s.telegramTugma}>
          <Text style={s.telegramMatn}>Telegram'da xabar olish</Text>
          <Text style={s.telegramIzoh}>
            Siz qatnashgan «Doimiy o'yin» yana e'lon qilinsa — Telegram'da xabar; haftasiga ko'pi bilan ikkita
          </Text>
        </Pressable>
      )}
      {!!xato && <Text style={s.ruxsat}>{xato}</Text>}
    </View>
  );
}

// Ulanish holatlari (README «Ulanish holatlari»): ulangan — o'zgarishlar o'zi ko'rinadi;
// ulanmoqda — ro'yxat ekranda qoladi, lekin eskirgan bo'lishi mumkin; ulanmagan — pastga tortib yangilash ishlaydi
function UlanishIzohi() {
  const h = useUlanishHolati();
  if (h === 'ulangan') return null;
  return (
    <Text style={s.izoh}>
      {h === 'ulanmoqda' ? "Ro'yxat eskirgan bo'lishi mumkin" : 'Yangilash uchun pastga torting'}
    </Text>
  );
}

function UlanishBelgisi() {
  const b = BELGI[useUlanishHolati()];
  return (
    <View style={s.belgi}>
      <View style={[s.nuqta, { backgroundColor: b.rang }]} />
      <Text style={[s.belgiMatn, { color: b.rang }]}>{b.matn}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  tepa: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  nom: { fontSize: 18, fontWeight: '700', color: R.yashil },
  hisobTugmalar: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sozlamaJoy: { marginHorizontal: 20, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: R.chiziq },
  sozlama: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sozlamaMatn: { fontSize: 15, color: R.matn },
  ruxsat: { fontSize: 13, color: '#C0392B', paddingBottom: 6 },
  telegramTugma: { paddingVertical: 8, gap: 2 },
  telegramMatn: { fontSize: 15, fontWeight: '600', color: R.yashil },
  telegramIzoh: { fontSize: 13, color: R.kulrang },
  telegramOchir: { fontSize: 14, color: R.yashil, paddingVertical: 8 },
  chiqish: { fontSize: 14, color: R.kulrang },
  kirish: { fontSize: 16, fontWeight: '600', color: R.yashil },
  ochirish: { fontSize: 14, color: '#C0392B' },
  ichi: { padding: 20, paddingTop: 4 },
  sarlavhaQator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  izoh: { fontSize: 14, color: R.kulrang, marginTop: -10, marginBottom: 14 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn },
  belgi: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nuqta: { width: 8, height: 8, borderRadius: 4 },
  belgiMatn: { fontSize: 14, fontWeight: '600' },
  xato: { color: '#C0392B', fontSize: 15, marginBottom: 12 },
  kutishMatn: { fontSize: 15, color: R.kulrang, textAlign: 'center' },
  kunGuruhi: { marginBottom: 20 },
  kunSarlavha: { fontSize: 18, fontWeight: '700', color: R.matn, marginBottom: 10 },
  oyinlar: { gap: 12 },
  karta: { padding: 14, borderWidth: 1, borderColor: R.chiziq, borderRadius: 12, gap: 4 },
  vaqt: { fontSize: 16, fontWeight: '600', color: R.matn },
  maydon: { fontSize: 15, color: R.kulrang },
  hisob: { fontSize: 16, fontWeight: '700', color: R.yashil },
  // kulrang chiziqlar balandligi — yonidagi yozuv qatoriga yaqin (16 · 15 · 16 px shrift), karta o'lchami haqiqiysiga teng
  chiziq: { backgroundColor: R.chiziq, borderRadius: 4, marginVertical: 1 },
  chiziqVaqt: { width: 56, height: 16 },
  chiziqMaydon: { width: 140, height: 14 },
  chiziqHisob: { width: 48, height: 16 },
  toldi: { color: '#C0392B' },
  tugma: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
