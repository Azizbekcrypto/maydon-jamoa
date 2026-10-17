import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tugma } from '@/components/forma';
import { PRO_TAKLIF } from '@/pro';
import { R } from '@/ranglar';

// To'lov taklifi ekrani (13-Modul 4-dars): «E'lon berish»da «Har hafta takrorlansin» bosilganda, Pro bo'lmasa ochiladi.
// Karta yoki boshqa to'lov ma'lumoti so'raladigan maydon yo'q. Orqaga qaytsa — belgi o'chiq qoladi.
export default function ProTaklif() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.ekran}>
      <View style={s.ichi}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={s.orqaga}>‹ Orqaga</Text>
        </Pressable>
        <Text style={s.sarlavha}>{PRO_TAKLIF.sarlavha}</Text>
        <Text style={s.matn}>{PRO_TAKLIF.matn}</Text>
        <Text style={s.narx}>{PRO_TAKLIF.narx}</Text>
      </View>
      <View style={s.past}>
        {/* «To'lovga o'tish» hozircha hech narsa qilmaydi — to'lov yo'li keyingi qadamda ulanadi */}
        <Tugma matn={PRO_TAKLIF.tugma} onPress={() => {}} />
        <Text style={s.test}>{PRO_TAKLIF.test}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon, justifyContent: 'space-between' },
  ichi: { padding: 20, gap: 14 },
  orqaga: { fontSize: 16, color: R.yashil, paddingVertical: 6 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn },
  matn: { fontSize: 17, color: R.matn },
  narx: { fontSize: 22, fontWeight: '700', color: R.yashil },
  past: { padding: 20, gap: 10 },
  test: { fontSize: 14, color: R.kulrang, textAlign: 'center' },
});
