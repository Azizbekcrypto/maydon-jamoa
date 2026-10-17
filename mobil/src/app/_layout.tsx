import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Ekranlar Stack'da: yangi ekran ustiga suriladi, «‹ O'yinlar» uni olib tashlaydi.
// Sarlavhani har ekran o'zi chizadi, shuning uchun Stack sarlavhasi yashirilgan.
export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
