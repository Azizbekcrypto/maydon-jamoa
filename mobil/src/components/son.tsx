import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type TextStyle } from 'react-native';

import { useHarakatKam } from '@/hooks/use-harakat-kam';

// Son o'zgarganda bir lahza kattalashadi va 0,3 soniyada silliq qaytadi («8 / 10» → «9 / 10»)
export function Son(p: { qiymat: number; style?: StyleProp<TextStyle> }) {
  const kam = useHarakatKam();
  const olcham = useRef(new Animated.Value(1)).current;
  const oldingi = useRef(p.qiymat);

  useEffect(() => {
    if (oldingi.current === p.qiymat) return;
    oldingi.current = p.qiymat;
    if (kam) return;
    olcham.setValue(1.3);
    Animated.timing(olcham, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [p.qiymat, kam, olcham]);

  return <Animated.Text style={[p.style, { transform: [{ scale: olcham }] }]}>{p.qiymat}</Animated.Text>;
}
