import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sora } from '@/api';
import { Maydoncha, Tugma } from '@/components/forma';
import { hodisaYoz } from '@/hodisa';
import { MAXFIYLIK } from '@/lending';
import { R } from '@/ranglar';

// Ro'yxatdan o'tish: POST /royxat { ism, login, parol, taklifKodi } → keyin «Kirish» ochiladi (token bu yerda berilmaydi).
// «Taklif kodi (bo'lsa)» (13-Modul 10-dars) — topilmasa Backend xabari maydonlar ostida chiqadi, hisob ochilmaydi.
// Telefon raqami so'ralmaydi — mahsulotga kerak emas (SMS yuborilmaydi). Login — o'zi tanlagan nom, band bo'lsa «Bu login band».
// Muvaffaqiyatli bo'lsa — qadam royxatdan-otdi.
export default function Royxat() {
  const router = useRouter();
  const [ism, setIsm] = useState('');
  const [login, setLogin] = useState('');
  const [parol, setParol] = useState('');
  // Taklif kodi (13-Modul 10-dars) — majburiy emas; APK havoladagi kodni olmaydi, shuning uchun qo'lda yoziladi
  const [taklifKodi, setTaklifKodi] = useState('');
  const [xabar, setXabar] = useState('');
  const [kutish, setKutish] = useState(false);

  async function yubor() {
    setXabar('');
    setKutish(true);
    try {
      await sora('/royxat', { method: 'POST', body: { ism, login, parol, taklifKodi } });
      hodisaYoz('royxatdan-otdi');
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
          nom="Login"
          value={login}
          onChangeText={setLogin}
          placeholder="ali"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Maydoncha nom="Parol" value={parol} onChangeText={setParol} secureTextEntry />
        <Maydoncha
          nom="Taklif kodi (bo'lsa)"
          value={taklifKodi}
          onChangeText={setTaklifKodi}
          placeholder="AB12CD"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Text style={s.gap}>Ism — o'yinchilar ko'radigan nom, familiya shart emas. Loginni boshqa o'yinchilar ko'rmaydi.</Text>
        <Pressable onPress={() => Linking.openURL(MAXFIYLIK)}>
          <Text style={s.siyosat}>Maxfiylik siyosati</Text>
        </Pressable>
        {!!xabar && <Text style={s.xato}>{xabar}</Text>}
        <Tugma matn="Ro'yxatdan o'tish" onPress={yubor} ochiq={kutish || !ism.trim() || !login.trim() || !parol} />
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
  gap: { fontSize: 14, color: R.kulrang },
  siyosat: { fontSize: 14, color: R.yashil, textDecorationLine: 'underline' },
  havola: { color: R.yashil, fontSize: 16, textAlign: 'center', padding: 8 },
});
