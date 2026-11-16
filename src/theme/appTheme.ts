import { Platform, TextStyle, ViewStyle } from 'react-native';
import { contrastRatio, withAlpha } from './engine';
import { fontFamilyFor, weightFor } from './fonts';
import type { ResolvedTheme, SanitizedTheme, ThemeColors } from './types';

/** Semantic colours not stored in theme tokens (status colours etc.). */
type StatusColors = {
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  /** Readable text colour on top of `accent`. */
  onAccent: string;
  /** Translucent primary for chips/selected states. */
  primarySoft: string;
  accentSoft: string;
  scrim: string;
};

export type AppColors = ThemeColors & StatusColors;

export type TypeVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'caption'
  | 'label'
  | 'overline';

export type AppTheme = {
  id: string;
  name: string;
  slug: string;
  colors: AppColors;
  type: Record<TypeVariant, TextStyle>;
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  radius: { xs: number; sm: number; md: number; lg: number; xl: number; pill: number };
  shadow: { card: ViewStyle; raised: ViewStyle; none: ViewStyle };
  touchTarget: number;
  /** Horizontal page gutter. */
  gutter: number;
  source: SanitizedTheme;
  resolution: Omit<ResolvedTheme, 'theme'>;
};

function readableOn(bg: string): string {
  return contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#1A1A1A')
    ? '#FFFFFF'
    : '#1A1A1A';
}

function shadowFor(level: SanitizedTheme['tokens']['shadow'], color: string) {
  const none: ViewStyle = { shadowOpacity: 0, elevation: 0 };
  if (level === 'none') {
    return { card: none, raised: none, none };
  }
  const lifted = level === 'lifted';
  const make = (y: number, r: number, o: number, e: number): ViewStyle =>
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: y },
        shadowRadius: r,
        shadowOpacity: o,
      },
      default: { elevation: e, shadowColor: color },
    });
  return {
    card: lifted ? make(6, 14, 0.12, 4) : make(3, 10, 0.07, 2),
    raised: lifted ? make(12, 24, 0.18, 10) : make(8, 18, 0.12, 6),
    none,
  };
}

/** Builds the full app design system from a resolved, sanitised theme. */
export function buildAppTheme(resolved: ResolvedTheme): AppTheme {
  const { theme } = resolved;
  const { colors, typography, radius } = theme.tokens;
  const base = typography.baseSize;
  const heading = fontFamilyFor(typography.headingFont);
  const body = fontFamilyFor(typography.bodyFont);
  const hw = weightFor(typography.headingWeight);
  const lh = (size: number, ratio = 1.4) => Math.round(size * ratio);

  const type: Record<TypeVariant, TextStyle> = {
    display: { fontFamily: heading, fontWeight: hw, fontSize: base + 15, lineHeight: lh(base + 15, 1.18) },
    h1: { fontFamily: heading, fontWeight: hw, fontSize: base + 9, lineHeight: lh(base + 9, 1.22) },
    h2: { fontFamily: heading, fontWeight: hw, fontSize: base + 5, lineHeight: lh(base + 5, 1.25) },
    h3: { fontFamily: heading, fontWeight: hw, fontSize: base + 2, lineHeight: lh(base + 2, 1.3) },
    title: { fontFamily: body, fontWeight: '600', fontSize: base + 1, lineHeight: lh(base + 1, 1.35) },
    body: { fontFamily: body, fontWeight: '400', fontSize: base, lineHeight: lh(base, 1.5) },
    bodyStrong: { fontFamily: body, fontWeight: '600', fontSize: base, lineHeight: lh(base, 1.5) },
    small: { fontFamily: body, fontWeight: '400', fontSize: base - 1, lineHeight: lh(base - 1, 1.45) },
    caption: { fontFamily: body, fontWeight: '400', fontSize: base - 3, lineHeight: lh(base - 3, 1.4) },
    label: { fontFamily: body, fontWeight: '600', fontSize: base - 1, lineHeight: lh(base - 1, 1.3) },
    overline: {
      fontFamily: body,
      fontWeight: '700',
      fontSize: base - 4,
      lineHeight: lh(base - 4, 1.3),
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
  };

  const status: StatusColors = {
    danger: '#B42318',
    dangerSoft: '#FDECEA',
    success: '#1E7A46',
    successSoft: '#E6F4EC',
    warning: '#B26A00',
    warningSoft: '#FFF4E0',
    info: '#1F5FA8',
    infoSoft: '#E8F0FB',
    onAccent: readableOn(colors.accent),
    primarySoft: withAlpha(colors.primary, 0.1),
    accentSoft: withAlpha(colors.accent, 0.16),
    scrim: 'rgba(0,0,0,0.45)',
  };

  return {
    id: theme.id,
    name: theme.name,
    slug: theme.slug,
    colors: { ...colors, ...status },
    type,
    spacing: { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
    radius: {
      xs: Math.round(radius * 0.25),
      sm: Math.round(radius * 0.5),
      md: Math.round(radius * 0.75),
      lg: radius,
      xl: Math.round(radius * 1.4),
      pill: 999,
    },
    shadow: shadowFor(theme.tokens.shadow, colors.heroOverlay),
    touchTarget: Platform.select({ android: 48, default: 44 }),
    gutter: 16,
    source: theme,
    resolution: {
      source: resolved.source,
      reason: resolved.reason,
      scheduleId: resolved.scheduleId,
    },
  };
}
