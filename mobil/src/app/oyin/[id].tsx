import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Son } from '@/components/son';
import { useOyinlar } from '@/oyinlar-holati';
import { R } from '@/ranglar';

// O'yin: bitta fayl to'rt o'yinni ochadi — id manzildan keladi (/oyin/2 → id = '2')
export default function OyinEkrani() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { oyinlar, qoshildim, qoshil } = useOyinlar();
  const oyin = oyinlar.find((o) => o.id === id);

  if (!oyin) {
    return (
      <SafeAreaView style={s.ekran}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.orqaga}>‹ O'yinlar</Text>
        </Pressable>
        <Text style={s.maydon}>O'yin topilmadi</Text>
      </SafeAreaView>
    );
  }

  const qoshilgan = qoshildim.includes(oyin.id);
  // Qo'shilganlar — ismsiz doiralar; jami doira = nechta odam kerak
  const doiralar = Array.from({ length: oyin.kerak }, (_, i) => i < oyin.qoshilgan);

  return (
    <SafeAreaView style={s.ekran}>
      <View style={s.ichi}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.orqaga}>‹ O'yinlar</Text>
        </Pressable>
        <Text style={s.sarlavha}>
          {oyin.kun}, {oyin.soat}
        </Text>
        <Text style={s.maydon}>{oyin.maydon}</Text>
        <View style={s.hisobQator}>
          <Son qiymat={oyin.qoshilgan} style={s.hisob} />
          <Text style={s.hisob}> / {oyin.kerak}</Text>
        </View>
        <View style={s.doiralar}>
          {doiralar.map((toli, i) => (
            <View key={i} style={s.doiraJoy}>
              <View style={[s.doira, toli && s.toli]} />
              {qoshilgan && i === oyin.qoshilgan - 1 && <Text style={s.siz}>Siz</Text>}
            </View>
          ))}
        </View>
      </View>
      <Pressable style={[s.tugma, qoshilgan && s.ochiq]} disabled={qoshilgan} onPress={() => qoshil(oyin.id)}>
        <Text style={[s.tugmaMatn, qoshilgan && s.ochiqMatn]}>{qoshilgan ? "Qo'shildingiz" : "Qo'shilaman"}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  ichi: { flex: 1, padding: 20 },
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
  tugma: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ochiq: { backgroundColor: R.chiziq },
  ochiqMatn: { color: R.kulrang },
});
