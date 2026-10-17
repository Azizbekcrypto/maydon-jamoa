import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOyinlar } from '@/oyinlar-holati';
import { R } from '@/ranglar';

// E'lon berish: kun · soat · maydon · nechta odam → «Yuborish» → O'yinlar
export default function Elon() {
  const router = useRouter();
  const { elonBer } = useOyinlar();
  const [kun, setKun] = useState('');
  const [soat, setSoat] = useState('');
  const [maydon, setMaydon] = useState('');
  const [kerak, setKerak] = useState('');

  const toliq = kun.trim() && soat.trim() && maydon.trim() && Number(kerak) > 0;

  function yubor() {
    if (!toliq) return;
    elonBer({ kun: kun.trim(), soat: soat.trim(), maydon: maydon.trim(), kerak: Number(kerak) });
    router.back();
  }

  return (
    <SafeAreaView style={s.ekran}>
      <ScrollView contentContainerStyle={s.ichi} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <Text style={s.orqaga}>‹ O'yinlar</Text>
        </Pressable>
        <Text style={s.sarlavha}>E'lon berish</Text>
        <Maydoncha nom="Kun" qiymat={kun} onChange={setKun} namuna="Yakshanba" />
        <Maydoncha nom="Soat" qiymat={soat} onChange={setSoat} namuna="19:00" />
        <Maydoncha nom="Maydon" qiymat={maydon} onChange={setMaydon} namuna="Maktab maydoni" />
        <Maydoncha nom="Nechta odam" qiymat={kerak} onChange={setKerak} namuna="10" raqam />
      </ScrollView>
      <Pressable style={[s.tugma, !toliq && s.ochiq]} disabled={!toliq} onPress={yubor}>
        <Text style={[s.tugmaMatn, !toliq && s.ochiqMatn]}>Yuborish</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Maydoncha(p: { nom: string; qiymat: string; onChange: (v: string) => void; namuna: string; raqam?: boolean }) {
  return (
    <View style={s.qator}>
      <Text style={s.yorliq}>{p.nom}</Text>
      <TextInput
        style={s.kiritish}
        value={p.qiymat}
        onChangeText={p.onChange}
        placeholder={p.namuna}
        placeholderTextColor={R.kulrang}
        keyboardType={p.raqam ? 'number-pad' : 'default'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  ichi: { padding: 20, gap: 14 },
  orqaga: { fontSize: 16, color: R.yashil, paddingVertical: 6 },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn },
  qator: { gap: 6 },
  yorliq: { fontSize: 15, color: R.kulrang },
  kiritish: { borderWidth: 1, borderColor: R.chiziq, borderRadius: 10, padding: 12, fontSize: 16, color: R.matn },
  tugma: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ochiq: { backgroundColor: R.chiziq },
  ochiqMatn: { color: R.kulrang },
});
