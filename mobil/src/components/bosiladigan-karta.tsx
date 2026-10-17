import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useHarakatKam } from '@/hooks/use-harakat-kam';

// Karta bosilganda kichrayib qaytadi — 0,15 soniya (prototipdagi transform + transition)
export function BosiladiganKarta(p: { style: StyleProp<ViewStyle>; onPress: () => void; children: ReactNode }) {
  const kam = useHarakatKam();
  const olcham = useRef(new Animated.Value(1)).current;

  function bor(qiymat: number) {
    if (kam) return;
    Animated.timing(olcham, { toValue: qiymat, duration: 150, useNativeDriver: true }).start();
  }

  return (
    <Pressable onPress={p.onPress} onPressIn={() => bor(0.96)} onPressOut={() => bor(1)}>
      <Animated.View style={[p.style, { transform: [{ scale: olcham }] }]}>{p.children}</Animated.View>
    </Pressable>
  );
}
