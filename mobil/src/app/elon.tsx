import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora } from '@/api';
import { Maydoncha, Tugma } from '@/components/forma';
import { keyingiKunlar, sanaNomi } from '@/kun';
import { menniOl, useMen } from '@/men';
import { R } from '@/ranglar';

// E'lon berish: kun · soat · maydon · nechta odam → «Yuborish» → POST /oyinlar (token bilan) → «O'yinlar».
// «Kim» so'ralmaydi — tashkilotchini Backend tokendan oladi. Biror maydon bo'sh bo'lsa, Backend 400 qaytaradi va
// ilova nima yetmaganini aytadi.
// «Har hafta takrorlansin» (13-Modul 4-dars) — «Doimiy o'yin», Pro'da: Pro bo'lmasa bosilganda to'lov taklifi ekrani ochiladi
// (orqaga qaytsa belgi o'chiq qoladi); Pro bo'lsa — belgi yonadi, ostida «Pro: {sana}gacha». Pro holati — GET /men dan, ekran ochilganda.
export default function Elon() {
  const router = useRouter();
  const kunlar = keyingiKunlar();
  const [kun, setKun] = useState('');
  const [soat, setSoat] = useState('');
  const [maydon, setMaydon] = useState('');
  const [kerak, setKerak] = useState('');
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);
  const [doimiy, setDoimiy] = useState(false);
  const men = useMen();

  useFocusEffect(
    useCallback(() => {
      menniOl().catch(() => {});
    }, []),
  );

  function takrorlansin(yangi: boolean) {
    if (yangi && !men?.pro) {
      router.push('/pro');
      return;
    }
    setDoimiy(yangi);
  }

  async function yubor() {
    setXabar('');
    setKutish(true);
    try {
      await sora('/oyinlar', {
        method: 'POST',
        body: {
          kun,
          soat: soat.trim(),
          maydon: maydon.trim(),
          kerak: kerak.trim() === '' ? '' : Number(kerak),
          doimiy: doimiy && !!men?.pro,
        },
      });
      router.back();
    } catch (e) {
      setXabar((e as Error).message);
    } finally {
      setKutish(false);
    }
  }

  return (
    <SafeAreaView style={s.ekran}>
      <ScrollView contentContainerStyle={s.ichi} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <Text style={s.orqaga}>‹ O'yinlar</Text>
        </Pressable>
        <Text style={s.sarlavha}>E'lon berish</Text>
        <View style={s.qator}>
          <Text style={s.yorliq}>Kun</Text>
          <View style={s.kunlar}>
            {kunlar.map((k, i) => (
              <Pressable key={k.sana} style={[s.kun, kun === k.sana && s.kunTanlangan]} onPress={() => setKun(k.sana)}>
                <Text style={[s.kunMatn, kun === k.sana && s.kunMatnTanlangan]}>
                  {k.nom}
                  {i === 0 ? ' · bugun' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Maydoncha nom="Soat" value={soat} onChangeText={setSoat} placeholder="19:00" />
        <Maydoncha nom="Maydon" value={maydon} onChangeText={setMaydon} placeholder="Maktab maydoni" />
        <Maydoncha nom="Nechta odam" value={kerak} onChangeText={setKerak} placeholder="10" keyboardType="number-pad" />
        <View style={s.qator}>
          <View style={s.belgiQator}>
            <Text style={s.belgiMatn}>Har hafta takrorlansin</Text>
            <Switch value={doimiy && !!men?.pro} onValueChange={takrorlansin} trackColor={{ true: R.yashil }} />
          </View>
          {men?.pro && men.proGacha && <Text style={s.proQator}>Pro: {sanaNomi(men.proGacha)}gacha</Text>}
        </View>
        {!!xabar && <Text style={s.xato}>{xabar}</Text>}
      </ScrollView>
      <View style={s.past}>
        <Tugma matn="Yuborish" onPress={yubor} ochiq={kutish} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  ichi: { padding: 20, gap: 14 },
  orqaga: { fontSize: 16, color: R.yashil, paddingVertical: 6 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn },
  qator: { gap: 6 },
  yorliq: { fontSize: 15, color: R.kulrang },
  kunlar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kun: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: R.chiziq },
  kunTanlangan: { backgroundColor: R.yashil, borderColor: R.yashil },
  kunMatn: { fontSize: 15, color: R.matn },
  kunMatnTanlangan: { color: '#fff' },
  belgiQator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  belgiMatn: { fontSize: 16, color: R.matn },
  proQator: { fontSize: 14, color: R.kulrang },
  xato: { color: '#C0392B', fontSize: 15 },
  past: { padding: 20 },
});
