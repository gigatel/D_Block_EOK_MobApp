import type { LucideIcon } from 'lucide-react-native';
import { create } from 'zustand';

export type AlertTone = 'primary' | 'danger' | 'success' | 'warning' | 'info';

export type AlertButton = {
  text: string;
  /** Same meaning as React Native's Alert: 'cancel' also handles back/backdrop. */
  style?: 'default' | 'cancel' | 'destructive';
  icon?: LucideIcon;
  onPress?: () => void | Promise<void>;
};

export type AlertOptions = {
  /** Icon in the badge at the top (defaults per tone). */
  icon?: LucideIcon;
  /** Colour of the icon badge. Defaults to 'danger' when a destructive button exists, else 'primary'. */
  tone?: AlertTone;
  /** Tap outside / back button closes (runs the cancel button). Default true when a cancel button exists. */
  dismissable?: boolean;
};

export type AlertRequest = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options: AlertOptions;
};

type AlertState = {
  queue: AlertRequest[];
  push: (a: Omit<AlertRequest, 'id'>) => void;
  shift: () => void;
};

let seq = 0;
export const useAlertStore = create<AlertState>(set => ({
  queue: [],
  push: a => set(s => ({ queue: [...s.queue, { ...a, id: ++seq }] })),
  shift: () => set(s => ({ queue: s.queue.slice(1) })),
}));

/**
 * Themed replacement for `Alert.alert` (same argument order), rendered by
 * `<AlertHost />` at the app root. Usable outside React.
 *
 *   showAlert('Sign out?', 'You will need your mobile number…', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Sign out', style: 'destructive', onPress: signOut },
 *   ], { icon: LogOut });
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[], options: AlertOptions = {}): void {
  useAlertStore.getState().push({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }], options });
}
