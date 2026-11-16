/**
 * Dynamic theme engine — pure functions, no React, no I/O.
 *
 * Port of the rules in frontend/src/app/core/theme/theme-engine.ts and
 * backend/src/DBlockEok.Application/Themes/ThemeEngine.cs. Keep all three in sync.
 *
 * Security: themes are DATA. Nothing here evaluates code, CSS, HTML or SVG markup;
 * unknown keys are dropped and every value is validated against a whitelist.
 */
import type { WeatherCondition } from '@/types/models';
import {
  COLOR_KEYS,
  DECORATIONS,
  DecorationKey,
  FONT_WHITELIST,
  FontName,
  HeadingWeight,
  LAYOUT_PRESETS,
  LayoutPreset,
  PATTERNS,
  PatternKey,
  ResolvedTheme,
  SanitizedTheme,
  ShadowLevel,
  ThemeColors,
  ThemeContent,
  ThemeDefinition,
  ThemeSchedule,
  ThemeTokens,
} from './types';

// ---- Defaults ----------------------------------------------------------------

/** Default RWA theme: ivory, forest green, muted gold, charcoal. */
export const DEFAULT_TOKENS: ThemeTokens = {
  colors: {
    primary: '#1F5A3A',
    primaryDark: '#143D27',
    onPrimary: '#FFFFFF',
    secondary: '#3E7C59',
    accent: '#B08D57',
    background: '#FBF8F1',
    surface: '#FFFFFF',
    surfaceAlt: '#F3EEE2',
    text: '#26282B',
    muted: '#6B6A63',
    border: '#E6DFCF',
    heroOverlay: '#0E2A1A',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    baseSize: 15,
    headingWeight: 700,
  },
  radius: 18,
  shadow: 'soft',
  heroOverlayOpacity: 0.45,
};

export const DEFAULT_CONTENT: ThemeContent = {
  heroTitle: 'D Block, East of Kailash',
  heroSubtitle:
    'A warm, green and well-kept neighbourhood — together as one community.',
  greeting: 'Welcome home',
  showGreeting: true,
};

/** Weather beats schedules whose priority is below this (seasons 5, festivals 20–80). */
export const WEATHER_OVERRIDE_BELOW_PRIORITY = 15;

/** IST is a fixed UTC+05:30 (no daylight saving). */
const IST_OFFSET_MS = 330 * 60 * 1000;

// ---- Sanitisation ------------------------------------------------------------

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const HEADING_WEIGHTS: HeadingWeight[] = [400, 500, 600, 700];
const SHADOWS: ShadowLevel[] = ['none', 'soft', 'lifted'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

function oneOf<T extends string | number>(
  v: unknown,
  allowed: readonly T[],
): v is T {
  return allowed.includes(v as T);
}

/**
 * Validates raw token JSON. Any invalid or missing value falls back to the
 * corresponding value of `fallback` (the default theme's tokens).
 */
export function sanitizeTokens(
  raw: unknown,
  fallback: ThemeTokens = DEFAULT_TOKENS,
): ThemeTokens {
  const src = isRecord(raw) ? raw : {};
  const rawColors = isRecord(src.colors) ? src.colors : {};
  const colors = {} as ThemeColors;
  for (const key of COLOR_KEYS) {
    const value = rawColors[key];
    colors[key] =
      typeof value === 'string' && HEX6.test(value)
        ? value.toUpperCase()
        : fallback.colors[key];
  }

  const rawTypo = isRecord(src.typography) ? src.typography : {};
  const typography = {
    headingFont: oneOf<FontName>(rawTypo.headingFont, FONT_WHITELIST)
      ? rawTypo.headingFont
      : fallback.typography.headingFont,
    bodyFont: oneOf<FontName>(rawTypo.bodyFont, FONT_WHITELIST)
      ? rawTypo.bodyFont
      : fallback.typography.bodyFont,
    baseSize: inRange(rawTypo.baseSize, 14, 19)
      ? Math.round(rawTypo.baseSize)
      : fallback.typography.baseSize,
    headingWeight: oneOf<HeadingWeight>(rawTypo.headingWeight, HEADING_WEIGHTS)
      ? rawTypo.headingWeight
      : fallback.typography.headingWeight,
  };

  return {
    colors,
    typography,
    radius: inRange(src.radius, 0, 32) ? src.radius : fallback.radius,
    shadow: oneOf<ShadowLevel>(src.shadow, SHADOWS) ? src.shadow : fallback.shadow,
    heroOverlayOpacity: inRange(src.heroOverlayOpacity, 0, 0.9)
      ? src.heroOverlayOpacity
      : fallback.heroOverlayOpacity,
  };
}

function cleanText(v: unknown, max: number, fallback: string): string {
  if (typeof v !== 'string') {
    return fallback;
  }
  // Strip control characters and anything that looks like markup.
  const text = v
    // eslint-disable-next-line no-control-regex -- intentionally strip control chars
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() : text;
}

export function sanitizeContent(
  raw: unknown,
  fallback: ThemeContent = DEFAULT_CONTENT,
): ThemeContent {
  const src = isRecord(raw) ? raw : {};
  return {
    heroTitle: cleanText(src.heroTitle, 90, fallback.heroTitle),
    heroSubtitle: cleanText(src.heroSubtitle, 240, fallback.heroSubtitle),
    greeting: cleanText(src.greeting, 140, fallback.greeting),
    showGreeting:
      typeof src.showGreeting === 'boolean'
        ? src.showGreeting
        : fallback.showGreeting,
  };
}

export function sanitizeTheme(
  theme: ThemeDefinition,
  fallbackTokens: ThemeTokens = DEFAULT_TOKENS,
): SanitizedTheme {
  return {
    ...theme,
    tokens: sanitizeTokens(theme.tokens, fallbackTokens),
    content: sanitizeContent(theme.content),
    layoutPreset: oneOf<LayoutPreset>(theme.layoutPreset, LAYOUT_PRESETS)
      ? theme.layoutPreset
      : 'classic',
    pattern: oneOf<PatternKey>(theme.pattern, PATTERNS) ? theme.pattern : 'none',
    // Unknown decoration keys are ignored; duplicates removed.
    decorations: Array.from(
      new Set(
        (Array.isArray(theme.decorations) ? theme.decorations : []).filter(
          (d): d is DecorationKey => oneOf<DecorationKey>(d, DECORATIONS),
        ),
      ),
    ),
  };
}

// ---- Scheduling ----------------------------------------------------------------

export type Window = { start: number; end: number };

/**
 * Time windows (epoch ms) in which a schedule applies, near `now`.
 * `Yearly` schedules repeat every year on the same IST calendar date/time,
 * including windows that wrap over New Year.
 */
export function windowsFor(schedule: ThemeSchedule, now: Date): Window[] {
  const start = Date.parse(schedule.startsAt);
  const end = Date.parse(schedule.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return [];
  }
  if (schedule.recurrence !== 'Yearly') {
    return [{ start, end }];
  }
  const duration = end - start;
  const s = new Date(start + IST_OFFSET_MS); // wall-clock IST in UTC fields
  const nowYear = new Date(now.getTime() + IST_OFFSET_MS).getUTCFullYear();
  const windows: Window[] = [];
  for (const year of [nowYear - 1, nowYear, nowYear + 1]) {
    const wStart =
      Date.UTC(
        year,
        s.getUTCMonth(),
        s.getUTCDate(),
        s.getUTCHours(),
        s.getUTCMinutes(),
        s.getUTCSeconds(),
      ) - IST_OFFSET_MS;
    windows.push({ start: wStart, end: wStart + duration });
  }
  return windows;
}

export type ResolveInput = {
  themes: ThemeDefinition[];
  schedules: ThemeSchedule[];
  now: Date;
  weather?: { condition: WeatherCondition } | null;
  weatherThemesEnabled?: boolean;
};

/** Built-in last resort if the server sends no usable default theme. */
const BUILTIN_DEFAULT: ThemeDefinition = {
  id: 'builtin-default',
  slug: 'default',
  name: 'Default RWA',
  description: 'Built-in fallback',
  isDefault: true,
  status: 'Published',
  layoutPreset: 'classic',
  pattern: 'none',
  decorations: [],
  tokens: DEFAULT_TOKENS,
  content: DEFAULT_CONTENT,
  decorationAssetIds: [],
};

/**
 * Picks the active theme:
 *  1. Enabled schedules of Published themes whose window covers `now`.
 *  2. Highest priority wins; ties → most recent window start → lowest schedule id.
 *  3. Weather theme (if enabled and matching) beats schedules with priority < 15.
 *  4. Otherwise the isDefault theme.
 */
export function resolveTheme(input: ResolveInput): ResolvedTheme {
  const { themes, schedules, now, weather, weatherThemesEnabled } = input;
  const published = themes.filter(t => t.status === 'Published');
  const byId = new Map(published.map(t => [t.id, t]));
  const defaultDef =
    published.find(t => t.isDefault) ??
    themes.find(t => t.isDefault) ??
    BUILTIN_DEFAULT;
  const baseTokens = sanitizeTokens(defaultDef.tokens);
  const finish = (
    def: ThemeDefinition,
    source: ResolvedTheme['source'],
    reason: string,
    scheduleId?: string,
  ): ResolvedTheme => ({
    theme: sanitizeTheme(def, baseTokens),
    source,
    reason,
    scheduleId,
  });

  const t = now.getTime();
  type Candidate = { schedule: ThemeSchedule; windowStart: number };
  const candidates: Candidate[] = [];
  for (const schedule of schedules) {
    if (!schedule.enabled || !byId.has(schedule.themeId)) {
      continue;
    }
    const covering = windowsFor(schedule, now).filter(
      w => w.start <= t && t < w.end,
    );
    for (const w of covering) {
      candidates.push({ schedule, windowStart: w.start });
    }
  }
  candidates.sort(
    (a, b) =>
      b.schedule.priority - a.schedule.priority ||
      b.windowStart - a.windowStart ||
      a.schedule.id.localeCompare(b.schedule.id),
  );
  const best = candidates[0];

  if (weatherThemesEnabled && weather?.condition) {
    const weatherTheme = published.find(
      th => th.weatherTrigger && th.weatherTrigger === weather.condition,
    );
    if (
      weatherTheme &&
      (!best || best.schedule.priority < WEATHER_OVERRIDE_BELOW_PRIORITY)
    ) {
      return finish(
        weatherTheme,
        'weather',
        `Live weather is "${weather.condition}"`,
      );
    }
  }

  if (best) {
    const def = byId.get(best.schedule.themeId)!;
    return finish(
      def,
      'schedule',
      `Scheduled: ${best.schedule.label} (priority ${best.schedule.priority})`,
      best.schedule.id,
    );
  }
  return finish(defaultDef, 'default', 'No schedule active — default theme');
}

/* eslint-disable no-bitwise -- hex colour channel maths */
// ---- Colour helpers ------------------------------------------------------------

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

/** WCAG contrast ratio between two #RRGGBB colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** #RRGGBB + alpha → rgba() string. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
