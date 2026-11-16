import { Linking } from 'react-native';

/** Opens the dialer. Strips everything except digits and '+'. */
export function callNumber(phone: string): void {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned) {
    Linking.openURL(`tel:${cleaned}`).catch(() => undefined);
  }
}

export function mailTo(email: string): void {
  Linking.openURL(`mailto:${email}`).catch(() => undefined);
}
