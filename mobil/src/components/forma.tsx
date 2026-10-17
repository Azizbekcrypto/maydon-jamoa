import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { R } from '@/ranglar';

// Forma qatori: yorliq va kiritish maydoni
export function Maydoncha(p: { nom: string } & TextInputProps) {
  const { nom, ...kiritish } = p;
  return (
    <View style={s.qator}>
      <Text style={s.yorliq}>{nom}</Text>
      <TextInput style={s.kiritish} placeholderTextColor={R.kulrang} {...kiritish} />
    </View>
  );
}

// Asosiy tugma (yashil); o'chiq bo'lsa — kulrang.
// kutmoqda (14-Modul 4-dars, bosish javobi): yozuv yonida kichik kutish belgisi — so'rov yuborildi, javob kutilmoqda.
export function Tugma(p: { matn: string; onPress: () => void; ochiq?: boolean; kutmoqda?: boolean }) {
  return (
    <Pressable style={[s.tugma, p.ochiq && s.ochiq]} disabled={p.ochiq} onPress={p.onPress}>
      <View style={s.tugmaIchi}>
        {p.kutmoqda && <ActivityIndicator size="small" color={R.kulrang} />}
        <Text style={[s.tugmaMatn, p.ochiq && s.ochiqMatn]}>{p.matn}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  qator: { gap: 6 },
  yorliq: { fontSize: 15, color: R.kulrang },
  kiritish: { borderWidth: 1, borderColor: R.chiziq, borderRadius: 10, padding: 12, fontSize: 16, color: R.matn },
  tugma: { padding: 16, borderRadius: 12, backgroundColor: R.yashil, alignItems: 'center' },
  tugmaIchi: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tugmaMatn: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ochiq: { backgroundColor: R.chiziq },
  ochiqMatn: { color: R.kulrang },
});
