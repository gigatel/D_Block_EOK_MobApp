import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useBootstrap } from '@/features/data/useBootstrap';
import { usePrefs } from '@/store/prefs';
import { isPreviewing, useThemePreview } from '@/store/themePreview';
import { MOCK_THEMES, MOCK_THEME_SCHEDULES } from '@/services/mock/themes';
import { env } from '@/config/env';
import { buildAppTheme, type AppTheme } from './appTheme';
import { resolveTheme, sanitizeTheme, sanitizeTokens } from './engine';
import type { ResolvedTheme } from './types';

type ThemeContextValue = {
  theme: AppTheme;
  /** True while an admin preview or simulation is active on this device. */
  previewing: boolean;
  /** Effective reduce-motion (system setting or user override). */
  reduceMotion: boolean;
};

const fallback = buildAppTheme(
  resolveTheme({ themes: env.DATA_MODE !== 'api' ? MOCK_THEMES : [], schedules: [], now: new Date() }),
);
const ThemeContext = createContext<ThemeContextValue>({
  theme: fallback,
  previewing: false,
  reduceMotion: false,
});

/** Re-render every `ms` and whenever the app returns to the foreground. */
function useClock(ms: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    const sub = AppState.addEventListener('change', s => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [ms]);
  return now;
}

function useSystemReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useBootstrap();
  const now = useClock(60_000);
  const preview = useThemePreview();
  const motion = usePrefs(s => s.motion);
  const systemReduced = useSystemReduceMotion();

  const value = useMemo<ThemeContextValue>(() => {
    const themes = data?.themes ?? (env.DATA_MODE !== 'api' ? MOCK_THEMES : []);
    const schedules = data?.themeSchedules ?? (env.DATA_MODE !== 'api' ? MOCK_THEME_SCHEDULES : []);
    const liveWeather = data?.settings.weatherThemesEnabled !== false ? data?.weather : null;
    let resolved: ResolvedTheme;

    const forced = preview.previewThemeId ? themes.find(t => t.id === preview.previewThemeId) : undefined;
    if (forced) {
      const def = themes.find(t => t.isDefault);
      resolved = {
        theme: sanitizeTheme(forced, sanitizeTokens(def?.tokens)),
        source: 'preview',
        reason: `Previewing “${forced.name}”`,
      };
    } else {
      resolved = resolveTheme({
        themes,
        schedules,
        now: preview.simulatedAt ? new Date(preview.simulatedAt) : new Date(now),
        weather:
          preview.simulatedWeather === undefined
            ? liveWeather
            : preview.simulatedWeather
            ? { condition: preview.simulatedWeather }
            : null,
        weatherThemesEnabled: data?.settings.weatherThemesEnabled ?? true,
      });
    }
    return {
      theme: buildAppTheme(resolved),
      previewing: isPreviewing(preview),
      reduceMotion: motion === 'reduced' || (motion === 'system' && systemReduced),
    };
  }, [data, now, preview, motion, systemReduced]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The active design system (colours, type scale, spacing, radius, shadows). */
export function useTheme(): AppTheme {
  return useContext(ThemeContext).theme;
}

export function useThemeState(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useReduceMotion(): boolean {
  return useContext(ThemeContext).reduceMotion;
}
