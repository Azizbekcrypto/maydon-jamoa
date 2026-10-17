import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora } from '@/api';
import { Maydoncha, Tugma } from '@/components/forma';
import { R } from '@/ranglar';

// Ro'yxatdan o'tish: POST /royxat { ism, telefon, parol } → keyin «Kirish» ochiladi (token bu yerda berilmaydi)
export default function Royxat() {
  const router = useRouter();
  const [ism, setIsm] = useState('');
  const [telefon, setTelefon] = useState('');
  const [parol, setParol] = useState('');
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);

  async function yubor() {
    setXabar('');
    setKutish(true);
    try {
      await sora('/royxat', { method: 'POST', body: { ism, telefon, parol } });
      router.replace('/kirish');
    } catch (e) {
      setXabar((e as Error).message);
    } finally {
      setKutish(false);
    }
  }

  return (
    <SafeAreaView style={s.ekran}>
      <ScrollView contentContainerStyle={s.ichi} keyboardShouldPersistTaps="handled">
        <Text style={s.nom}>Maydon Jamoa</Text>
        <Text style={s.sarlavha}>Ro'yxatdan o'tish</Text>
        <Maydoncha nom="Ism" value={ism} onChangeText={setIsm} placeholder="Ali" />
        <Maydoncha
          nom="Telefon"
          value={telefon}
          onChangeText={setTelefon}
          placeholder="+998 90 000 00 01"
          keyboardType="phone-pad"
        />
        <Maydoncha nom="Parol" value={parol} onChangeText={setParol} secureTextEntry />
        {!!xabar && <Text style={s.xato}>{xabar}</Text>}
        <Tugma matn="Ro'yxatdan o'tish" onPress={yubor} ochiq={kutish || !ism.trim() || !telefon.trim() || !parol} />
        <Pressable onPress={() => router.replace('/kirish')}>
          <Text style={s.havola}>Kirish</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.fon },
  ichi: { padding: 20, gap: 14 },
  nom: { fontSize: 18, fontWeight: '700', color: R.yashil },
  sarlavha: { fontSize: 26, fontWeight: '700', color: R.matn },
  xato: { color: '#C0392B', fontSize: 15 },
  havola: { color: R.yashil, fontSize: 16, textAlign: 'center', padding: 8 },
});
