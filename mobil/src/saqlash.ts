import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Telefonda saqlanadigan qiymatlar (token, qurilma ID). Telefonda — expo-secure-store (shifrlab saqlaydi);
// brauzer ko'rinishida expo-secure-store yo'q — brauzer xotirasi (localStorage), 11-Modul web-trek qarori.
const brauzer = Platform.OS === 'web';

export async function ol(kalit: string): Promise<string | null> {
  return brauzer ? localStorage.getItem(kalit) : SecureStore.getItemAsync(kalit);
}

export async function saqla(kalit: string, qiymat: string): Promise<void> {
  if (brauzer) localStorage.setItem(kalit, qiymat);
  else await SecureStore.setItemAsync(kalit, qiymat);
}

export async function ochir(kalit: string): Promise<void> {
  if (brauzer) localStorage.removeItem(kalit);
  else await SecureStore.deleteItemAsync(kalit);
}
