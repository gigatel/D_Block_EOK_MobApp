import { trigger, HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { usePrefs } from '@/store/prefs';

type Kind = 'selection' | 'light' | 'success' | 'warning' | 'error';
const MAP: Record<Kind, HapticFeedbackTypes> = {
  selection: HapticFeedbackTypes.selection,
  light: HapticFeedbackTypes.impactLight,
  success: HapticFeedbackTypes.notificationSuccess,
  warning: HapticFeedbackTypes.notificationWarning,
  error: HapticFeedbackTypes.notificationError,
};

/** Fire a haptic if the user has haptics enabled (Settings). */
export function haptic(kind: Kind = 'selection'): void {
  if (!usePrefs.getState().haptics) {
    return;
  }
  try {
    trigger(MAP[kind], { enableVibrateFallback: false, ignoreAndroidSystemSettings: false });
  } catch {
    // Haptics are best-effort.
  }
}
