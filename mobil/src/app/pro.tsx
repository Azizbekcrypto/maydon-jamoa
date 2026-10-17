import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora } from '@/api';
import { Tugma } from '@/components/forma';
import { menniOl } from '@/men';
import { PRO_TAKLIF } from '@/pro';
import { R } from '@/ranglar';

// To'lov taklifi ekrani (13-Modul 4-dars): «E'lon berish»da «Har hafta takrorlansin» bosilganda, Pro bo'lmasa ochiladi.
// Karta yoki boshqa to'lov ma'lumoti so'raladigan maydon yo'q. Orqaga qaytsa — belgi o'chiq qoladi.
// «To'lovga o'tish» → POST /tolov/boshlash (to'lov raqamini Backend beradi) → havola telefon brauzerida ochiladi
// (brauzer ko'rinishida — yangi oynada): «Mashq to'lov» sahifasi. Ilovaga qaytganda GET /men qayta so'raladi —
// Pro yoqilgan bo'lsa, ekran yopiladi va «E'lon berish»da belgi va «Pro: {sana}gacha» ko'rinadi.
export default function ProTaklif() {
  const router = useRouter();
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);

  useEffect(() => {
    const obuna = AppState.addEventListener('change', (holat) => {
      if (holat !== 'active') return;
      menniOl()
        .then((men) => {
          if (men.pro) router.back();
        })
        .catch(() => {});
    });
    return () => obuna.remove();
  }, [router]);

  async function tolovgaOt() {
    setXabar('');
    setKutish(true);
    try {
      const { havola } = await sora<{ tolovRaqami: string; havola: string }>('/tolov/boshlash', { method: 'POST' });
      await Linking.openURL(havola);
    } catch (e) {
      setXabar((e as Error).message);
    } finally {
      setKutish(false);
    }
  }

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
        {!!xabar && <Text style={s.xato}>{xabar}</Text>}
        <Tugma matn={PRO_TAKLIF.tugma} onPress={tolovgaOt} ochiq={kutish} />
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
  xato: { color: '#C0392B', fontSize: 15, textAlign: 'center' },
  test: { fontSize: 14, color: R.kulrang, textAlign: 'center' },
});
