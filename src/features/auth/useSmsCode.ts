import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

/**
 * OTP auto-fill.
 *  - Android: Google SMS User Consent API (native module `SmsConsent`). When the
 *    SMS arrives the system asks "Allow D Block EOK to read this message?"; on
 *    Allow the code is filled in. No SMS permission, nothing stored.
 *  - iOS: handled by the keyboard (`textContentType="oneTimeCode"` on OtpInput).
 */
type SmsConsentNative = { start(): Promise<boolean>; stop(): void };
const native: SmsConsentNative | undefined = Platform.OS === 'android' ? NativeModules.SmsConsent : undefined;

/** Start listening (idempotent). Call just before requesting an OTP so a fast SMS isn't missed. */
export function startSmsListener(): void {
  native?.start().catch(() => undefined);
}

/** Pulls the one-time code out of an SMS: prefers digits next to "OTP"/"code", else the first standalone group. */
export function extractOtp(message: string | null | undefined, length = 6): string | null {
  if (!message) return null;
  const near = new RegExp(`(?:otp|code|pin)\\D{0,20}(\\d{${length}})(?!\\d)`, 'i').exec(message);
  if (near) return near[1];
  const any = new RegExp(`(?<!\\d)(\\d{${length}})(?!\\d)`).exec(message);
  return any ? any[1] : null;
}

/** Listens for an incoming OTP SMS while the screen is mounted. */
export function useSmsCode(onCode: (code: string) => void, length = 6): void {
  const cb = useRef(onCode);
  cb.current = onCode;
  useEffect(() => {
    if (!native) return;
    native.start().catch(() => undefined);
    const emitter = new NativeEventEmitter(NativeModules.SmsConsent);
    const sub = emitter.addListener('SmsConsentMessage', (message: unknown) => {
      if (typeof message !== 'string') return;
      const code = extractOtp(message, length);
      if (code) cb.current(code);
    });
    return () => {
      sub.remove();
      native.stop();
    };
  }, [length]);
}
