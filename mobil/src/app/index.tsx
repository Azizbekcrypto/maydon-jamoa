import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora, tokenOchir, tokenOl } from '@/api';
import { BosiladiganKarta } from '@/components/bosiladigan-karta';
import { kunNomi } from '@/kun';
import { R } from '@/ranglar';

// Backend javobidagi o'yin: GET /oyinlar
type Oyin = { id: number; kun: string; soat: string; maydon: string; kerak: number };

// O'yinlar: ro'yxat Backend'dan (GET /oyinlar, token bilan), eng yangi e'lon tepada.
// Ekran ochilganda so'raladi (E'lon berishdan qaytganda ham — yangi e'lon tepada). Token bo'lmasa — «Kirish».
export default function Oyinlar() {
  const router = useRouter();
  const [oyinlar, setOyinlar] = useState<Oyin[] | null>(null);
  const [xato, setXato] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!(await tokenOl())) {
          router.replace('/kirish');
          return;
        }
        try {
          setOyinlar(await sora<Oyin[]>('/oyinlar'));
          setXato('');
        } catch (e) {
          setXato((e as Error).message);
        }
      })();
    }, [router]),
  );

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
      <ScrollView contentContainerStyle={s.ichi}>
        <Text style={s.sarlavha}>O'yinlar</Text>
        {!oyinlar && !xato && <ActivityIndicator color={R.yashil} />}
        {!!xato && <Text style={s.xato}>O'yinlarni yuklab bo'lmadi: {xato}</Text>}
        <View style={s.oyinlar}>
          {oyinlar?.map((o) => (
            <BosiladiganKarta key={o.id} style={s.karta} onPress={() => router.push(`/oyin/${o.id}`)}>
              <Text style={s.vaqt}>
                {kunNomi(o.kun)}, {o.soat}
              </Text>
              <Text style={s.maydon}>{o.maydon}</Text>
              <Text style={s.hisob}>{o.kerak} kishi kerak</Text>
            </BosiladiganKarta>
          ))}
        </View>
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
  oyinlar: { gap: 12 },
  karta: { padding: 14, borderWidth: 1, borderColor: R.chiziq, borderRadius: 12, gap: 4 },
  vaqt: { fontSize: 16, fontWeight: '600', color: R.matn },
  maydon: { fontSize: 15, color: R.kulrang },
  hisob: { fontSize: 16, fontWeight: '700', color: R.yashil },
  tugma: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
