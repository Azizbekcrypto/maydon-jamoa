import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora, tokenOl } from '@/api';
import { Tugma } from '@/components/forma';
import { Son } from '@/components/son';
import { oyinEslatmasiniBekor, oyinEslatmasiniQoy, uchKunlikniQoy } from '@/eslatma';
import { hodisaYoz, qurilmaniYoz } from '@/hodisa';
import { kunNomi } from '@/kun';
import { taklifHavolasi, ULASHISH_HAVOLASI } from '@/lending';
import { menniOl } from '@/men';
import { oyinlarniOl, useOyinlar, type Oyin } from '@/oyin';
import { R } from '@/ranglar';
import { tasdiqSora } from '@/tasdiq';
import { oyinniOch, oyinniYop, ulan, useKorayotganlar } from '@/ulanish';

// O'yin: bitta fayl har o'yinni ochadi — id manzildan keladi (/oyin/2 → id = '2').
// Ma'lumot GET /oyinlar dan (alohida yo'l yo'q): «8 / 10», qo'shilganlar va tugma.
// Ekran ochilganda, pastga tortib yangilaganda va oyin-ozgardi hodisasidan keyin — «O'yinlar» bilan bitta javobdan (oyin.ts).
// To'lgan o'yinda «Qo'shilaman» o'rnida «Navbatga yozilish»; qo'shilgan va navbatdagi o'yinchida — «O'yindan chiqish».
// «Hozir ko'ryapti: N»: ekran ochilganda Backend'ga oyin-ochildi, yopilganda oyin-yopildi — ulanish o'yin xonasiga
// kiradi va chiqadi; son korayotganlar-ozgardi bilan keladi (o'zim ham sanalaman, ism ko'rsatilmaydi).
// Ochiq o'yin ulanish.ts da eslab qolinadi: qayta ulanganda ilova shu xonaga qayta kiradi.
// «Havolani ulashish» (10-dars) — o'yinni e'lon qilgan tashkilotchida: telefonning ulashish oynasi ochiladi, tashkilotchi
// o'zi tanlagan joyga (o'z jamoasiga) yuboradi — ilova hech kimga o'zi yubormaydi. Havola — lending, ?kanal=ilova belgisi bilan;
// 13-Modul 10-darsdan — taklif havolasi ?taklif=<kod>&kanal=taklif.
// Mehmon ko'rinishi (kirmagan odam, 8-dars): o'yin ko'rinadi, «Qo'shilaman» (to'lgan o'yinda «Navbatga yozilish») — «Ro'yxatdan o'tish».
export default function OyinEkrani() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const oyinlar = useOyinlar();
  // undefined — javob hali kelmagan · null — bunday o'yin yo'q
  const oyin: Oyin | null | undefined = oyinlar ? (oyinlar.find((o) => String(o.id) === id) ?? null) : undefined;
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);
  const [tortildi, setTortildi] = useState(false);
  // «Kelaman»: Backend rad etgan bo'lsa — sababi
  const [tasdiqXabar, setTasdiqXabar] = useState('');
  const [mehmon, setMehmon] = useState(false);

  const yukla = useCallback(async () => {
    const token = await tokenOl();
    setMehmon(!token);
    // Ekran to'g'ridan-to'g'ri ochilgan bo'lsa ham (masalan, brauzer ko'rinishida havola) — kirgan odam ulanadi
    if (token) ulan();
    try {
      await oyinlarniOl();
    } catch (e) {
      setXabar((e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      yukla();
      oyinniOch(Number(id));
      return () => oyinniYop(Number(id));
    }, [yukla, id]),
  );
  const korayotgan = useKorayotganlar(Number(id));

  async function tort() {
    setTortildi(true);
    setXabar('');
    await yukla();
    setTortildi(false);
  }

  // «Qo'shilaman» → …/qoshilish · «Navbatga yozilish» → …/navbat · «O'yindan chiqish» → …/chiqish.
  // Javob kelguncha tugmalar o'chiq — ikki marta bosilmaydi. 409 bo'lsa — Backend xabari tugma ostida.
  async function harakat(yol: 'qoshilish' | 'navbat' | 'chiqish') {
    setXabar('');
    setKutish(true);
    try {
      await sora(`/oyinlar/${id}/${yol}`, { method: 'POST' });
      // Qadamlar sanog'i: «Qo'shilaman» muvaffaqiyatli bo'lganda — qoshildi
      if (yol === 'qoshilish') hodisaYoz('qoshildi');
      // Eslatma (eslatma.ts) — Backend javobi muvaffaqiyatli bo'lgandan keyin; eslatma xatosi asosiy ishni buzmaydi.
      // «Qo'shilaman» → o'yindan bir soat oldin; «O'yindan chiqish» → bekor; keyin uch kunlik eslatma qayta hisoblanadi
      (async () => {
        if (yol === 'qoshilish' && oyin) await oyinEslatmasiniQoy(oyin);
        if (yol === 'chiqish') await oyinEslatmasiniBekor(Number(id));
        if (yol !== 'navbat') await uchKunlikniQoy();
      })().catch(() => {});
    } catch (e) {
      setXabar((e as Error).message);
    } finally {
      await yukla();
      setKutish(false);
    }
  }

  // 13-Modul 10-dars: havola — shaxsiy, o'z taklif kodi bilan (GET /men dagi taklifKodi); tugma nomi va joyi o'zgarmagan
  async function ulash(o: Oyin) {
    try {
      await qurilmaniYoz();
      const { taklifKodi } = await menniOl();
      const havola = taklifKodi ? taklifHavolasi(taklifKodi) : ULASHISH_HAVOLASI;
      await Share.share({ message: `${kunNomi(o.kun)}, ${o.soat} · ${o.maydon} — Maydon Jamoa'da qo'shiling: ${havola}` });
    } catch (e) {
      setXabar((e as Error).message);
    }
  }

  function chiq() {
    tasdiqSora('Rostdan chiqasizmi?', () => harakat('chiqish'));
  }

  // «Kelaman» → POST /oyinlar/:id/tasdiq. Tugma faqat menTasdiqlayOlaman bo'lsa chiqadi, lekin ruxsatni baribir
  // Backend har so'rovda beradi: aks holda 403 va sabab — tugma ostida.
  async function tasdiqla() {
    setTasdiqXabar('');
    setKutish(true);
    try {
      await sora(`/oyinlar/${id}/tasdiq`, { method: 'POST' });
      hodisaYoz('tasdiqladi');
    } catch (e) {
      setTasdiqXabar((e as Error).message);
    } finally {
      await yukla();
      setKutish(false);
    }
  }

  if (oyin === undefined && !xabar) {
    return (
      <SafeAreaView style={s.ekran}>
        <ActivityIndicator color={R.yashil} style={s.ichi} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.ekran}>
      <ScrollView
        contentContainerStyle={s.ichi}
        refreshControl={<RefreshControl refreshing={tortildi} onRefresh={tort} tintColor={R.yashil} colors={[R.yashil]} />}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={s.orqaga}>‹ O'yinlar</Text>
        </Pressable>
        {!oyin ? (
          <Text style={s.maydon}>O'yin topilmadi</Text>
        ) : (
          <>
            <Text style={s.sarlavha}>
              {kunNomi(oyin.kun)}, {oyin.soat}
            </Text>
            <Text style={s.maydon}>{oyin.maydon}</Text>
            <View style={s.hisobQator}>
              <Son qiymat={oyin.qoshilgan} style={s.hisob} />
              <Text style={s.hisob}> / {oyin.kerak}</Text>
            </View>
            <Doiralar oyin={oyin} />
            {korayotgan !== null && <Text style={s.korayotgan}>Hozir ko'ryapti: {korayotgan}</Text>}
            {!mehmon && (oyin.navbatda > 0 || oyin.qoshilgan >= oyin.kerak) && (
              <Text style={s.navbat}>Navbatda: {oyin.navbatda}</Text>
            )}
            {oyin.tasdiqlagan !== null && (
              <Text style={s.tasdiq}>
                Kelishini tasdiqladi: {oyin.tasdiqlagan} / {oyin.qoshilgan}
              </Text>
            )}
          </>
        )}
      </ScrollView>
      {oyin && (
        <View style={s.past}>
          {!!xabar && <Text style={s.xato}>{xabar}</Text>}
          {mehmon ? (
            <Tugma
              matn={oyin.qoshilgan >= oyin.kerak ? 'Navbatga yozilish' : "Qo'shilaman"}
              onPress={() => router.push('/royxat')}
            />
          ) : oyin.menNavbatdaman ? (
            <Text style={s.navbatdasiz}>Navbatdasiz</Text>
          ) : oyin.menQoshilganman ? (
            <Tugma matn="Qo'shildingiz" onPress={() => {}} ochiq />
          ) : oyin.qoshilgan >= oyin.kerak ? (
            <Tugma matn="Navbatga yozilish" onPress={() => harakat('navbat')} ochiq={kutish} />
          ) : (
            <Tugma matn="Qo'shilaman" onPress={() => harakat('qoshilish')} ochiq={kutish} />
          )}
          {oyin.menTasdiqlaganman ? (
            <Tugma matn="Tasdiqladingiz" onPress={() => {}} ochiq />
          ) : (
            oyin.menTasdiqlayOlaman && <Tugma matn="Kelaman" onPress={tasdiqla} ochiq={kutish} />
          )}
          {(oyin.menQoshilganman || oyin.menNavbatdaman) && (
            <Pressable style={s.chiqish} disabled={kutish} onPress={chiq}>
              <Text style={s.chiqishMatn}>O'yindan chiqish</Text>
            </Pressable>
          )}
          {!!tasdiqXabar && <Text style={s.xato}>{tasdiqXabar}</Text>}
          {oyin.menTashkilotchiman && (
            <Pressable style={s.ulashish} onPress={() => ulash(oyin)}>
              <Text style={s.ulashishMatn}>Havolani ulashish</Text>
            </Pressable>
          )}
          {oyin.menTashkilotchiman && (
            <Text style={s.qoida}>
              Siz taklif qilgan yangi o'yinchi o'yinga qo'shilsa yoki o'yin e'lon qilsa — Pro'ga 7 kun qo'shiladi (haftasiga ko'pi bilan 2 marta).
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// Qo'shilganlar — ismsiz doiralar; jami doira = nechta odam kerak.
// O'yinchi qo'shilgan bo'lsa, oxirgi to'la doira ostida «Siz».
// Tashkilotchida: kelishini tasdiqlaganlar doirasi yashil ✓, qolgan qo'shilganlar — kulrang.
function Doiralar({ oyin }: { oyin: Oyin }) {
  const soni = Math.max(oyin.kerak, oyin.qoshilgan);
  const tashkilotchi = oyin.tasdiqlagan !== null;
  return (
    <View style={s.doiralar}>
      {Array.from({ length: soni }, (_, i) => (
        <View key={i} style={s.doiraJoy}>
          <View
            style={[
              s.doira,
              i < oyin.qoshilgan && (tashkilotchi ? s.qoshilgan : s.toli),
              tashkilotchi && i < (oyin.tasdiqlagan ?? 0) && s.toli,
            ]}>
            {tashkilotchi && i < (oyin.tasdiqlagan ?? 0) && <Text style={s.belgi}>✓</Text>}
          </View>
          {oyin.menQoshilganman && i === oyin.qoshilgan - 1 && <Text style={s.siz}>Siz</Text>}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  ichi: { padding: 20 },
  orqaga: { fontSize: 16, color: R.yashil, paddingVertical: 6 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn, marginTop: 8 },
  maydon: { fontSize: 16, color: R.kulrang, marginTop: 4 },
  hisobQator: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16 },
  hisob: { fontSize: 40, fontWeight: '700', color: R.matn },
  doiralar: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, maxWidth: 260 },
  doiraJoy: { alignItems: 'center', width: 40 },
  doira: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: R.chiziq },
  toli: { backgroundColor: R.yashil, borderColor: R.yashil },
  qoshilgan: { backgroundColor: R.kulrang, borderColor: R.kulrang },
  belgi: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  tasdiq: { fontSize: 16, fontWeight: '600', color: R.matn, marginTop: 16 },
  siz: { fontSize: 12, color: R.kulrang },
  korayotgan: { fontSize: 15, color: R.kulrang, marginTop: 12 },
  navbat: { fontSize: 15, color: R.kulrang, marginTop: 12 },
  navbatdasiz: { fontSize: 16, fontWeight: '600', color: R.matn, textAlign: 'center', padding: 8 },
  ulashish: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: R.yashil, alignItems: 'center' },
  ulashishMatn: { color: R.yashil, fontSize: 16, fontWeight: '600' },
  qoida: { fontSize: 13, color: R.kulrang, textAlign: 'center' },
  chiqish: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#C0392B', alignItems: 'center' },
  chiqishMatn: { color: '#C0392B', fontSize: 16, fontWeight: '600' },
  past: { padding: 20, gap: 10 },
  xato: { color: '#C0392B', fontSize: 15, textAlign: 'center' },
});
