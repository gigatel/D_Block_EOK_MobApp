import * as Keychain from 'react-native-keychain';
import { logger } from '@/utils/logger';

/**
 * Stores ONLY the opaque bearer session token (never passwords or OTPs)
 * in the iOS Keychain / Android Keystore.
 */
/** `token` is null for cookie sessions (the native cookie store holds the cookie). */
export type StoredSession = { token: string | null; expiresAt: string };

const SERVICE = 'com.dblockeok.session';
const USERNAME = 'session';

let cache: StoredSession | null | undefined;

export async function saveSession(session: StoredSession): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, JSON.stringify(session), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  cache = session;
}

export async function getSession(): Promise<StoredSession | null> {
  if (cache !== undefined) {
    return cache;
  }
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    const parsed = result ? (JSON.parse(result.password) as StoredSession) : null;
    cache = parsed && Date.parse(parsed.expiresAt) > Date.now() ? parsed : null;
  } catch {
    logger.warn('Secure storage read failed');
    cache = null;
  }
  return cache;
}

export async function getToken(): Promise<string | null> {
  return (await getSession())?.token ?? null;
}

export async function clearSession(): Promise<void> {
  cache = null;
  await Keychain.resetGenericPassword({ service: SERVICE });
}
