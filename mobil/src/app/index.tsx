import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOyinlar } from '@/oyinlar-holati';
import { R } from '@/ranglar';

// O'yinlar: kartalar (kun, soat, maydon, «8 / 10»), pastda «E'lon berish»
export default function Oyinlar() {
  const router = useRouter();
  const { oyinlar } = useOyinlar();

  return (
    <SafeAreaView style={s.ekran}>
      <Text style={s.nom}>Maydon Jamoa</Text>
      <ScrollView contentContainerStyle={s.ichi}>
        <Text style={s.sarlavha}>O'yinlar</Text>
        <View style={s.oyinlar}>
          {oyinlar.map((o) => (
            <Pressable key={o.id} style={s.karta} onPress={() => router.push(`/oyin/${o.id}`)}>
              <Text style={s.vaqt}>
                {o.kun}, {o.soat}
              </Text>
              <Text style={s.maydon}>{o.maydon}</Text>
              <Text style={s.hisob}>
                {o.qoshilgan} / {o.kerak}
              </Text>
            </Pressable>
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
  nom: { paddingHorizontal: 20, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: R.yashil },
  ichi: { padding: 20, paddingTop: 4 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn, marginBottom: 16 },
  oyinlar: { gap: 12 },
  karta: { padding: 14, borderWidth: 1, borderColor: R.chiziq, borderRadius: 12, gap: 4 },
  vaqt: { fontSize: 16, fontWeight: '600', color: R.matn },
  maydon: { fontSize: 15, color: R.kulrang },
  hisob: { fontSize: 16, fontWeight: '700', color: R.yashil },
  tugma: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
