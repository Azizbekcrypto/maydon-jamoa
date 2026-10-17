import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { OyinlarHolati } from '@/oyinlar-holati';

// Ekranlar Stack'da: yangi ekran ustiga suriladi, «‹ O'yinlar» uni olib tashlaydi.
// Sarlavhani har ekran o'zi chizadi (prototipdagidek), shuning uchun Stack sarlavhasi yashirilgan.
export default function Layout() {
  return (
    <OyinlarHolati>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </OyinlarHolati>
  );
}
