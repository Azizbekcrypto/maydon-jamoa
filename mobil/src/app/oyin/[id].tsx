import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora } from '@/api';
import { Tugma } from '@/components/forma';
import { Son } from '@/components/son';
import { kunNomi } from '@/kun';
import { oyinlarniOl, type Oyin } from '@/oyin';
import { R } from '@/ranglar';

// O'yin: bitta fayl har o'yinni ochadi — id manzildan keladi (/oyin/2 → id = '2').
// Ma'lumot GET /oyinlar dan (alohida yo'l yo'q): «8 / 10», qo'shilganlar va tugma.
// Ekran ochilganda va pastga tortib yangilaganda qayta so'raladi. To'lgan o'yinda «Qo'shilaman» o'rnida «O'yin to'ldi».
export default function OyinEkrani() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [oyin, setOyin] = useState<Oyin | null | undefined>(undefined);
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);
  const [tortildi, setTortildi] = useState(false);
  // «Kelaman»: shu ekranda tasdiqlandimi va Backend rad etgan bo'lsa — sababi
  const [tasdiqladim, setTasdiqladim] = useState(false);
  const [tasdiqXabar, setTasdiqXabar] = useState('');

  const yukla = useCallback(async () => {
    try {
      const oyinlar = await oyinlarniOl();
      setOyin(oyinlar.find((o) => String(o.id) === id) ?? null);
    } catch (e) {
      setXabar((e as Error).message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      yukla();
    }, [yukla]),
  );

  async function tort() {
    setTortildi(true);
    setXabar('');
    await yukla();
    setTortildi(false);
  }

  // «Qo'shilaman» → POST /oyinlar/:id/qoshilish. Javob kelguncha tugma o'chiq — ikki marta bosilmaydi.
  // 409 bo'lsa («O'yin to'ldi», «Siz bu o'yinga qo'shilgansiz») — Backend xabari tugma ostida.
  async function qoshil() {
    setXabar('');
    setKutish(true);
    try {
      await sora(`/oyinlar/${id}/qoshilish`, { method: 'POST' });
    } catch (e) {
      setXabar((e as Error).message);
    } finally {
      await yukla();
      setKutish(false);
    }
  }

  // «Kelaman» → POST /oyinlar/:id/tasdiq. Ruxsatni Backend beradi: faqat o'yin kuni va faqat qo'shilgan o'yinchiga;
  // aks holda 403 va sabab («Tasdiq faqat o'yin kuni» yoki «Siz bu o'yinga qo'shilmagansiz») — tugma ostida.
  async function tasdiqla() {
    setTasdiqXabar('');
    setKutish(true);
    try {
      await sora(`/oyinlar/${id}/tasdiq`, { method: 'POST' });
      setTasdiqladim(true);
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
        <Pressable onPress={() => router.back()}>
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
          </>
        )}
      </ScrollView>
      {oyin && (
        <View style={s.past}>
          {!!xabar && <Text style={s.xato}>{xabar}</Text>}
          {oyin.menQoshilganman ? (
            <Tugma matn="Qo'shildingiz" onPress={() => {}} ochiq />
          ) : oyin.qoshilgan >= oyin.kerak ? (
            <Tugma matn="O'yin to'ldi" onPress={() => {}} ochiq />
          ) : (
            <Tugma matn="Qo'shilaman" onPress={qoshil} ochiq={kutish} />
          )}
          {tasdiqladim ? (
            <Tugma matn="Tasdiqladingiz" onPress={() => {}} ochiq />
          ) : (
            <Tugma matn="Kelaman" onPress={tasdiqla} ochiq={kutish} />
          )}
          {!!tasdiqXabar && <Text style={s.xato}>{tasdiqXabar}</Text>}
        </View>
      )}
    </SafeAreaView>
  );
}

// Qo'shilganlar — ismsiz doiralar; jami doira = nechta odam kerak.
// O'yinchi qo'shilgan bo'lsa, oxirgi to'la doira ostida «Siz».
function Doiralar({ oyin }: { oyin: Oyin }) {
  const soni = Math.max(oyin.kerak, oyin.qoshilgan);
  return (
    <View style={s.doiralar}>
      {Array.from({ length: soni }, (_, i) => (
        <View key={i} style={s.doiraJoy}>
          <View style={[s.doira, i < oyin.qoshilgan && s.toli]} />
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
  siz: { fontSize: 12, color: R.kulrang },
  past: { padding: 20, gap: 10 },
  xato: { color: '#C0392B', fontSize: 15, textAlign: 'center' },
});
