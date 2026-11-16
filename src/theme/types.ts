import type {
  Recurrence,
  ThemeStatus,
  WeatherTrigger,
} from '@/types/models';

export const FONT_WHITELIST = [
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'Tiro Devanagari Hindi',
  'Inter',
  'Mukta',
  'Poppins',
  'Montserrat',
  'Yatra One',
] as const;
export type FontName = (typeof FONT_WHITELIST)[number];

export const LAYOUT_PRESETS = ['classic', 'centered', 'festive', 'minimal'] as const;
export type LayoutPreset = (typeof LAYOUT_PRESETS)[number];

export const PATTERNS = [
  'none',
  'dots',
  'paisley',
  'rangoli',
  'lattice',
  'confetti',
  'chakra',
  'snowflakes',
  'raindrops',
  'leaves',
  'blossom',
  'sunburst',
  'waves',
] as const;
export type PatternKey = (typeof PATTERNS)[number];

export const DECORATIONS = [
  'marigold-garland',
  'diya-row',
  'fireworks',
  'colour-splash',
  'tricolour-bunting',
  'kites',
  'snowfall',
  'rain',
  'lightning',
  'fog',
  'clouds',
  'falling-leaves',
  'petals',
  'sun-rays',
] as const;
export type DecorationKey = (typeof DECORATIONS)[number];

export const COLOR_KEYS = [
  'primary',
  'primaryDark',
  'onPrimary',
  'secondary',
  'accent',
  'background',
  'surface',
  'surfaceAlt',
  'text',
  'muted',
  'border',
  'heroOverlay',
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type ThemeColors = Record<ColorKey, string>;

export type ShadowLevel = 'none' | 'soft' | 'lifted';
export type HeadingWeight = 400 | 500 | 600 | 700;

export type ThemeTokens = {
  colors: ThemeColors;
  typography: {
    headingFont: FontName;
    bodyFont: FontName;
    baseSize: number; // 14–19
    headingWeight: HeadingWeight;
  };
  radius: number; // 0–32
  shadow: ShadowLevel;
  heroOverlayOpacity: number; // 0–0.9
};

export type ThemeContent = {
  heroTitle: string; // ≤ 90
  heroSubtitle: string; // ≤ 240
  greeting: string; // ≤ 140
  showGreeting: boolean;
};

/** A theme row as delivered by GET /api/bootstrap (JSON columns already parsed). */
export type ThemeDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  isDefault: boolean;
  status: ThemeStatus;
  layoutPreset: string;
  pattern: string;
  decorations: string[];
  tokens: unknown;
  content: unknown;
  logoAssetId?: string | null;
  heroAssetId?: string | null;
  decorationAssetIds: string[];
  weatherTrigger?: WeatherTrigger | null;
  /** Mobile-only grouping for the theme library UI. */
  group?: 'festival' | 'season' | 'weather';
};

export type ThemeSchedule = {
  id: string;
  themeId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  priority: number;
  recurrence: Recurrence;
  enabled: boolean;
};

export type ThemeAsset = {
  id: string;
  themeId?: string | null;
  kind: string;
  name: string;
  url: string;
};

/** A theme after sanitisation: every field is guaranteed valid. */
export type SanitizedTheme = Omit<
  ThemeDefinition,
  'tokens' | 'content' | 'layoutPreset' | 'pattern' | 'decorations'
> & {
  tokens: ThemeTokens;
  content: ThemeContent;
  layoutPreset: LayoutPreset;
  pattern: PatternKey;
  decorations: DecorationKey[];
};

export type ResolutionSource = 'schedule' | 'weather' | 'default' | 'preview';

export type ResolvedTheme = {
  theme: SanitizedTheme;
  source: ResolutionSource;
  reason: string;
  scheduleId?: string;
};
