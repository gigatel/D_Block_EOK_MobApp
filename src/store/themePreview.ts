import { create } from 'zustand';
import type { WeatherCondition } from '@/types/models';

/**
 * Admin theme preview & simulator. Local to this device only —
 * "Previewing — only you see this".
 */
type ThemePreviewState = {
  /** Force a specific theme (preview). */
  previewThemeId: string | null;
  /** Simulated "now" (ISO) for schedule testing. */
  simulatedAt: string | null;
  /** undefined = live weather; null = no weather; else simulated condition. */
  simulatedWeather: WeatherCondition | null | undefined;
  preview: (themeId: string) => void;
  simulate: (opts: { at?: string | null; weather?: WeatherCondition | null | undefined }) => void;
  backToLive: () => void;
};

export const useThemePreview = create<ThemePreviewState>(set => ({
  previewThemeId: null,
  simulatedAt: null,
  simulatedWeather: undefined,
  preview: previewThemeId => set({ previewThemeId }),
  simulate: opts =>
    set(s => ({
      previewThemeId: null,
      simulatedAt: opts.at === undefined ? s.simulatedAt : opts.at,
      // Passing `weather: undefined` explicitly means "back to live weather".
      simulatedWeather: 'weather' in opts ? opts.weather : s.simulatedWeather,
    })),
  backToLive: () => set({ previewThemeId: null, simulatedAt: null, simulatedWeather: undefined }),
}));

export const isPreviewing = (s: Pick<ThemePreviewState, 'previewThemeId' | 'simulatedAt' | 'simulatedWeather'>) =>
  s.previewThemeId !== null || s.simulatedAt !== null || s.simulatedWeather !== undefined;
