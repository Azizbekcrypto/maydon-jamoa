import { Alert, Platform } from 'react-native';

// «Rostdan …?» savoli (Yo'q · Ha). Telefonda — Alert; brauzer ko'rinishida Alert tugmalari ishlamaydi — window.confirm.
export function tasdiqSora(savol: string, ha: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(savol)) ha();
    return;
  }
  Alert.alert(savol, undefined, [
    { text: "Yo'q", style: 'cancel' },
    { text: 'Ha', style: 'destructive', onPress: ha },
  ]);
}
