import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokenOl } from '@/api';
import { eslatmaBosilishiniSana, uchKunlikniQoy } from '@/eslatma';
import { hodisaYoz } from '@/hodisa';
import { menniOl } from '@/men';
import { R } from '@/ranglar';
import { useJonliXabarlar } from '@/ulanish';

// Ekranlar Stack'da: yangi ekran ustiga suriladi, «‹ O'yinlar» uni olib tashlaydi.
// Sarlavhani har ekran o'zi chizadi, shuning uchun Stack sarlavhasi yashirilgan.
// Hamma ekranlar tepasida — jonli xabarlar (ulanish.ts): bir necha soniya turadi va o'zi yo'qoladi.
// Qadamlar sanog'i: ilova ochilganda — ochdi (bitta ochilishga bitta).
// Uch kunlik eslatma (eslatma.ts): ilova ochilganda va fondan qaytganda — oldingisi bekor, yangisi uch kundan keyin 17:00 ga
// (faqat hisobga kirgan foydalanuvchiga).
let ochdiYozildi = false;

async function uchKunlikniYangila() {
  if (await tokenOl()) await uchKunlikniQoy();
}

// Pro holati (13-Modul 4-dars) — ilova ochilganda, faqat kirgan foydalanuvchiga (GET /men)
async function proniYangila() {
  if (await tokenOl()) await menniOl();
}

export default function Layout() {
  useEffect(() => {
    if (!ochdiYozildi) {
      ochdiYozildi = true;
      hodisaYoz('ochdi');
      // Brauzer ko'rinishi Telegram xabaridagi havola bilan ochildi (13-Modul 8-dars) — bitta ochilishga bitta yozuv:
      // sahifa yuklanganda bir marta (qayta chizilganda emas); ochdi avvalgidek yoziladi
      if (Platform.OS === 'web' && new URLSearchParams(window.location.search).get('kanal') === 'telegram') {
        hodisaYoz('telegramdan-ochdi');
      }
    }
    uchKunlikniYangila().catch(() => {});
    proniYangila().catch(() => {});
    // Eslatma bosilib ochilganini sanash (9-dars)
    const eslatmaObunasi = eslatmaBosilishiniSana();
    let oldingi: string | null | undefined = AppState.currentState;
    const obuna = AppState.addEventListener('change', (yangi) => {
      if (oldingi === 'background' && yangi === 'active') uchKunlikniYangila().catch(() => {});
      oldingi = yangi;
    });
    return () => {
      obuna.remove();
      eslatmaObunasi();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      <JonliXabarlar />
    </>
  );
}

function JonliXabarlar() {
  const xabarlar = useJonliXabarlar();
  if (!xabarlar.length) return null;
  return (
    <SafeAreaView style={s.joy} pointerEvents="none" edges={['top']}>
      {xabarlar.map((x) => (
        <View key={x.id} style={s.xabar}>
          <Text style={s.nom}>Maydon Jamoa</Text>
          <Text style={s.matn}>{x.matn}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  joy: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, gap: 8 },
  xabar: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: R.matn,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  nom: { color: '#9FE3B4', fontSize: 13, fontWeight: '700' },
  matn: { color: '#fff', fontSize: 15, marginTop: 2 },
});
