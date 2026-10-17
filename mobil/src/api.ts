import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Backend manzili — mobil/.env dagi EXPO_PUBLIC_API_URL (maxfiy emas: ilovada ochiq ko'rinadi)
export const API = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

// Token telefonda expo-secure-store da — qiymatni shifrlab saqlaydi
const KALIT = 'token';
export const tokenOl = () => SecureStore.getItemAsync(KALIT);
export const tokenSaqla = (token: string) => SecureStore.setItemAsync(KALIT, token);
export const tokenOchir = () => SecureStore.deleteItemAsync(KALIT);

export class SorovXatosi extends Error {
  constructor(
    public holat: number,
    xabar: string,
  ) {
    super(xabar);
  }
}

// Backend'ga so'rov. Token bo'lsa — yopiq so'rovga qo'shiladi (Authorization: Bearer <token>).
// Javob 401 bo'lsa — token o'chiriladi va «Kirish» ochiladi.
export async function sora<T>(yol: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await tokenOl();
  const javob = await fetch(`${API}${yol}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const matn = await javob.text();
  const malumot = matn ? JSON.parse(matn) : null;
  if (javob.status === 401 && yol !== '/kirish') {
    await tokenOchir();
    router.replace('/kirish');
  }
  if (!javob.ok) {
    const xabar = Array.isArray(malumot?.message) ? malumot.message.join(', ') : malumot?.message;
    throw new SorovXatosi(javob.status, xabar ?? `Xato: ${javob.status}`);
  }
  return malumot as T;
}
