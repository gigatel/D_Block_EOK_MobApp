import { create } from 'zustand';
import type { NotificationCategory } from '@/types/models';

/**
 * Non-sensitive device preferences. Kept in memory in Phase 1; notification
 * preferences sync to the server in Phase 3 (API-GAPS §6.4).
 */
export type MotionPref = 'system' | 'reduced' | 'full';

type PrefsState = {
  haptics: boolean;
  motion: MotionPref;
  push: Record<Exclude<NotificationCategory, 'general'>, boolean>;
  setHaptics: (on: boolean) => void;
  setMotion: (m: MotionPref) => void;
  setPush: (cat: keyof PrefsState['push'], on: boolean) => void;
};

export const usePrefs = create<PrefsState>(set => ({
  haptics: true,
  motion: 'system',
  push: { announcements: true, events: true, complaints: true, polls: true, theme: false },
  setHaptics: haptics => set({ haptics }),
  setMotion: motion => set({ motion }),
  setPush: (cat, on) => set(s => ({ push: { ...s.push, [cat]: on } })),
}));
