import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora, tokenOchir, tokenOl } from '@/api';
import { BosiladiganKarta } from '@/components/bosiladigan-karta';
import { kunNomi } from '@/kun';
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

// O'yinlar: ro'yxat Backend'dan (GET /oyinlar, token bilan). Token bo'lmasa — «Kirish». To'lgan o'yinda son yonida «to'ldi».
// «8 / 10» — real vaqt nuqtasi: ekran ochilganda, pastga tortib yangilaganda, oyin-ozgardi hodisasidan keyin va
// qayta ulanganda (uzilish paytidagi hodisa kelmaydi) — ulanish.ts qayta so'raydi, ro'yxat shu javobdan o'zi yangilanadi.
// Token o'qilgach ilova Backend'ga doimiy ulanadi; sarlavha yonida — ulanish belgisi.
export default function Oyinlar() {
  const router = useRouter();
  const oyinlar = useOyinlar();
  const [xato, setXato] = useState('');
  const [tortildi, setTortildi] = useState(false);

  const yukla = useCallback(async () => {
    if (!(await tokenOl())) {
      router.replace('/kirish');
      return;
    }
    // Ulanish bor bo'lsa — qayta ochilmaydi (ekran necha marta ochilsa ham bitta)
    ulan();
    try {
      await oyinlarniOl();
      setXato('');
    } catch (e) {
      setXato((e as Error).message);
    }
  }, [router]);

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
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    await tokenOchir();
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
        <View style={s.hisobTugmalar}>
          <Pressable onPress={hisobdanChiq}>
            <Text style={s.chiqish}>Hisobdan chiqish</Text>
          </Pressable>
          <Pressable onPress={hisobniOchir}>
            <Text style={s.ochirish}>Hisobni o'chirish</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.ichi}
        refreshControl={<RefreshControl refreshing={tortildi} onRefresh={tort} tintColor={R.yashil} colors={[R.yashil]} />}>
        <View style={s.sarlavhaQator}>
          <Text style={s.sarlavha}>O'yinlar</Text>
          <UlanishBelgisi />
        </View>
        <UlanishIzohi />
        {!oyinlar && !xato && <ActivityIndicator color={R.yashil} />}
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
      <Pressable style={s.tugma} onPress={() => router.push('/elon')}>
        <Text style={s.tugmaMatn}>E'lon berish</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Ulanish belgisi: «Ulangan» (yashil nuqta) · «Ulanmoqda…» · «Ulanmagan» (kulrang)
const BELGI = {
  ulangan: { matn: 'Ulangan', rang: R.yashil },
  ulanmoqda: { matn: 'Ulanmoqda…', rang: '#D08A1E' },
  ulanmagan: { matn: 'Ulanmagan', rang: R.kulrang },
} as const;

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
  hisobTugmalar: { flexDirection: 'row', gap: 16 },
  chiqish: { fontSize: 14, color: R.kulrang },
  ochirish: { fontSize: 14, color: '#C0392B' },
  ichi: { padding: 20, paddingTop: 4 },
  sarlavhaQator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  izoh: { fontSize: 14, color: R.kulrang, marginTop: -10, marginBottom: 14 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn },
  belgi: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nuqta: { width: 8, height: 8, borderRadius: 4 },
  belgiMatn: { fontSize: 14, fontWeight: '600' },
  xato: { color: '#C0392B', fontSize: 15, marginBottom: 12 },
  kunGuruhi: { marginBottom: 20 },
  kunSarlavha: { fontSize: 18, fontWeight: '700', color: R.matn, marginBottom: 10 },
  oyinlar: { gap: 12 },
  karta: { padding: 14, borderWidth: 1, borderColor: R.chiziq, borderRadius: 12, gap: 4 },
  vaqt: { fontSize: 16, fontWeight: '600', color: R.matn },
  maydon: { fontSize: 15, color: R.kulrang },
  hisob: { fontSize: 16, fontWeight: '700', color: R.yashil },
  toldi: { color: '#C0392B' },
  tugma: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
