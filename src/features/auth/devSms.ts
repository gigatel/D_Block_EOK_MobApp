/**
 * The server returns `devSms` (the simulated SMS) when no SMS gateway is
 * configured. Debug builds show it on the OTP screen, like the website does.
 * Release builds never show it.
 */
export function devSmsText(devSms: unknown): string | null {
  if (!__DEV__ || devSms == null) return null;
  if (typeof devSms === 'string') return devSms;
  if (typeof devSms === 'object') {
    const o = devSms as Record<string, unknown>;
    const text = o.message ?? o.body ?? o.text ?? o.code;
    if (typeof text === 'string' || typeof text === 'number') return String(text);
    try {
      return JSON.stringify(devSms);
    } catch {
      return null;
    }
  }
  return String(devSms);
}
