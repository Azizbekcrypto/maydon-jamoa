import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type TextStyle } from 'react-native';

import { useHarakatKam } from '@/hooks/use-harakat-kam';

// Muvaffaqiyat (14-Modul 4-dars): o'z qo'shilishi muvaffaqiyatli bo'lganda son bir lahza kattalashadi va 0,3 soniyada
// silliq qaytadi («8 / 10» → «9 / 10»), bir marta. pop — shunday har muvaffaqiyatda bittaga oshadi.
// Son boshqa sabab bilan o'zgarsa (jonli son — boshqa o'yinchi, real vaqt) — animatsiyasiz almashadi.
// Telefonda «harakatni kamaytirish» yoqilgan bo'lsa — kattalashmaydi, yangi son harakatsiz almashadi.
export function Son(p: { qiymat: number; pop?: number; style?: StyleProp<TextStyle> }) {
  const kam = useHarakatKam();
  const olcham = useRef(new Animated.Value(1)).current;
  const oldingi = useRef(p.pop);

  useEffect(() => {
    if (oldingi.current === p.pop) return;
    oldingi.current = p.pop;
    if (kam) return;
    olcham.setValue(1.3);
    Animated.timing(olcham, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [p.pop, kam, olcham]);

  return <Animated.Text style={[p.style, { transform: [{ scale: olcham }] }]}>{p.qiymat}</Animated.Text>;
}
