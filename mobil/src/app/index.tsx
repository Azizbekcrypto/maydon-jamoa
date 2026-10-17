import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokenOchir, tokenOl } from '@/api';
import { BosiladiganKarta } from '@/components/bosiladigan-karta';
import { kunNomi } from '@/kun';
import { oyinlarniOl, type Oyin } from '@/oyin';
import { R } from '@/ranglar';

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

// O'yinlar: ro'yxat Backend'dan (GET /oyinlar, token bilan).
// «8 / 10» — real vaqt nuqtasi: ekran ochilganda va pastga tortib yangilaganda qayta so'raladi
// (ekran o'zi yangilanmaydi). Token bo'lmasa — «Kirish». To'lgan o'yinda son yonida «to'ldi».
export default function Oyinlar() {
  const router = useRouter();
  const [oyinlar, setOyinlar] = useState<Oyin[] | null>(null);
  const [xato, setXato] = useState('');
  const [tortildi, setTortildi] = useState(false);

  const yukla = useCallback(async () => {
    if (!(await tokenOl())) {
      router.replace('/kirish');
      return;
    }
    try {
      setOyinlar(await oyinlarniOl());
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

  async function hisobdanChiq() {
    await tokenOchir();
    router.replace('/kirish');
  }

  return (
    <SafeAreaView style={s.ekran}>
      <View style={s.tepa}>
        <Text style={s.nom}>Maydon Jamoa</Text>
        <Pressable onPress={hisobdanChiq}>
          <Text style={s.chiqish}>Hisobdan chiqish</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={s.ichi}
        refreshControl={<RefreshControl refreshing={tortildi} onRefresh={tort} tintColor={R.yashil} colors={[R.yashil]} />}>
        <Text style={s.sarlavha}>O'yinlar</Text>
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

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  tepa: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  nom: { fontSize: 18, fontWeight: '700', color: R.yashil },
  chiqish: { fontSize: 14, color: R.kulrang },
  ichi: { padding: 20, paddingTop: 4 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn, marginBottom: 16 },
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
