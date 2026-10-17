import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Telefonda «harakatni kamaytirish» yoqilganmi — yoqilgan bo'lsa, kichrayish va kattalashish bo'lmaydi
export function useHarakatKam(): boolean {
  const [kam, setKam] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setKam);
    const obuna = AccessibilityInfo.addEventListener('reduceMotionChanged', setKam);
    return () => obuna.remove();
  }, []);
  return kam;
}
