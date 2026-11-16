import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds-remaining countdown (e.g. OTP resend wait). `restart(n)` starts again.
 * Ticks once per second and stops at 0.
 */
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.round(initialSeconds)),
  );

  useEffect(() => {
    if (remaining <= 0) {
      return undefined;
    }
    const id = setTimeout(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const restart = useCallback((seconds: number) => {
    setRemaining(Math.max(0, Math.round(seconds)));
  }, []);

  return { remaining, done: remaining <= 0, restart };
}

/** "0:30" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
