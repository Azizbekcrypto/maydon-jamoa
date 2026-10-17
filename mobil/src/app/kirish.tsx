import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora, tokenSaqla } from '@/api';
import { Maydoncha, Tugma } from '@/components/forma';
import { uchKunlikniQoy } from '@/eslatma';
import { qurilmaniYoz } from '@/hodisa';
import { R } from '@/ranglar';

// Kirish: POST /kirish { login, parol } → token telefonda expo-secure-store ga saqlanadi → «O'yinlar»
export default function Kirish() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [parol, setParol] = useState('');
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);

  async function kir() {
    setXabar('');
    setKutish(true);
    try {
      const { token } = await sora<{ token: string }>('/kirish', { method: 'POST', body: { login, parol } });
      await tokenSaqla(token);
      uchKunlikniQoy().catch(() => {});
      // Shu qurilma hisobning qurilmalari ro'yxatiga (13-Modul 10-dars)
      qurilmaniYoz();
      router.replace('/');
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
        <Text style={s.sarlavha}>Kirish</Text>
        <Maydoncha nom="Login" value={login} onChangeText={setLogin} placeholder="ali" autoCapitalize="none" autoCorrect={false} />
        <Maydoncha nom="Parol" value={parol} onChangeText={setParol} secureTextEntry />
        {!!xabar && <Text style={s.xato}>{xabar}</Text>}
        <Tugma matn="Kirish" onPress={kir} ochiq={kutish || !login.trim() || !parol} />
        <Pressable onPress={() => router.replace('/royxat')}>
          <Text style={s.havola}>Ro'yxatdan o'tish</Text>
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
