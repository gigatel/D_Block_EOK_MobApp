import React, { memo, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  SvgUri,
} from 'react-native-svg';
import { env } from '@/config/env';
import { useBootstrap } from '@/features/data/useBootstrap';
import { useReduceMotion, useTheme, type AppTheme } from '@/theme';
import { DecorationLayer } from '@/theme/decorations';
import { PatternBackground } from '@/theme/patterns';
import { RemoteImage } from './RemoteImage';
import { Text } from './Text';

export type ThemeHeroProps = {
  /** Defaults to the active theme's content.heroTitle. */
  title?: string;
  subtitle?: string;
  /** Small line above the title, e.g. "Good evening, Anjali". */
  eyebrow?: string;
  /** Rendered at the bottom of the hero (buttons, chips...). */
  children?: React.ReactNode;
  /** Shorter hero for inner pages. */
  compact?: boolean;
  /** Top inset (safe area) to pad content below the status bar. */
  topInset?: number;
};

const cleanId = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');

/**
 * Resolves a theme hero asset to something safe to render:
 *  - same-origin `/themes/*.svg` → SvgUri
 *  - same-origin raster (e.g. /api/theme-assets/{id}/file) → RemoteImage
 *  - anything else (absolute/foreign URLs, data: URIs) → nothing
 */
function useHeroAsset(
  theme: AppTheme,
): { kind: 'svg' | 'raster'; uri: string } | null {
  const { data } = useBootstrap();
  const assetId = theme.source.heroAssetId;
  return useMemo(() => {
    if (!assetId) return null;
    const asset = data?.themeAssets.find(a => a.id === assetId);
    const url = asset?.url ?? '';
    if (!url.startsWith('/') || url.startsWith('//') || url.includes('..'))
      return null;
    const uri = `${env.API_BASE_URL}${url}`;
    if (url.startsWith('/themes/') && url.toLowerCase().endsWith('.svg'))
      return { kind: 'svg', uri };
    if (url.toLowerCase().endsWith('.svg')) return null;
    return { kind: 'raster', uri };
  }, [assetId, data?.themeAssets]);
}

/** Gradient + glow background for each layout preset (memoised; no per-frame work). */
const HeroBackground = memo(function HeroBackgroundImpl({
  theme,
}: {
  theme: AppTheme;
}) {
  const id = cleanId(useId());
  const c = theme.colors;
  const preset = theme.source.layoutPreset;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        {preset === 'classic' ? (
          <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c.primaryDark} />
            <Stop offset="1" stopColor={c.primary} />
          </LinearGradient>
        ) : preset === 'centered' ? (
          <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.primary} />
            <Stop offset="1" stopColor={c.primaryDark} />
          </LinearGradient>
        ) : preset === 'festive' ? (
          <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c.primaryDark} />
            <Stop offset="0.55" stopColor={c.primary} />
            <Stop offset="1" stopColor={c.secondary} />
          </LinearGradient>
        ) : (
          <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.surfaceAlt} />
            <Stop offset="1" stopColor={c.background} />
          </LinearGradient>
        )}
        <RadialGradient id={`${id}glow`} cx="85%" cy="15%" r="60%">
          <Stop
            offset="0"
            stopColor={c.accent}
            stopOpacity={preset === 'festive' ? 0.55 : 0.28}
          />
          <Stop offset="1" stopColor={c.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id}bg)`} />
      {preset !== 'minimal' ? (
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id}glow)`} />
      ) : null}
    </Svg>
  );
});

/** Bottom scrim (heroOverlay × heroOverlayOpacity) so text stays readable over art. */
const Scrim = memo(function ScrimImpl({
  color,
  opacity,
}: {
  color: string;
  opacity: number;
}) {
  const id = cleanId(useId());
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.45" stopColor={color} stopOpacity={opacity * 0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={opacity} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
});

/** Centered preset: emblem with the society monogram ringed by the theme colours. */
function Emblem({ theme }: { theme: AppTheme }) {
  const c = theme.colors;
  return (
    <View
      style={styles.emblem}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Svg
        width={64}
        height={64}
        viewBox="0 0 64 64"
        style={StyleSheet.absoluteFill}
      >
        <Circle
          cx={32}
          cy={32}
          r={30}
          fill={c.onPrimary}
          fillOpacity={0.12}
          stroke={c.accent}
          strokeWidth={2}
        />
        <Circle
          cx={32}
          cy={32}
          r={24}
          fill="none"
          stroke={c.onPrimary}
          strokeOpacity={0.5}
          strokeWidth={1}
          strokeDasharray="2 4"
        />
      </Svg>
      <Text variant="h2" color="onPrimary">
        D
      </Text>
    </View>
  );
}

/** Three-part rule (accent · white · secondary) — tricolour-friendly for national days. */
function TriRule({ theme }: { theme: AppTheme }) {
  return (
    <View style={styles.triRule}>
      <View style={[styles.triSeg, { backgroundColor: theme.colors.accent }]} />
      <View
        style={[styles.triSeg, { backgroundColor: theme.colors.onPrimary }]}
      />
      <View
        style={[styles.triSeg, { backgroundColor: theme.colors.secondary }]}
      />
    </View>
  );
}

/**
 * Data-driven hero. Its look follows the active theme's layoutPreset:
 *  - classic: diagonal primary gradient, pattern, decorations, left-aligned copy
 *  - centered: vertical gradient, emblem, centered copy, tri-colour rule
 *  - festive: rich 3-stop gradient + accent glow, prominent decorations, accent eyebrow pill
 *  - minimal: calm light band, faint pattern, dark text (weather themes)
 */
export function ThemeHero({
  title,
  subtitle,
  eyebrow,
  children,
  compact,
  topInset = 0,
}: ThemeHeroProps) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const asset = useHeroAsset(theme);
  const { source, colors: c } = theme;
  const preset = source.layoutPreset;
  const minimal = preset === 'minimal';
  const centered = preset === 'centered';
  const festive = preset === 'festive';
  const textColor = minimal ? 'text' : 'onPrimary';
  const heading = title ?? source.content.heroTitle;
  const sub = subtitle ?? source.content.heroSubtitle;

  return (
    <View
      style={[
        styles.hero,
        {
          minHeight: (compact ? 210 : festive ? 360 : 330) + topInset,
          paddingTop:
            topInset +
            theme.spacing.xl +
            (source.decorations.length && !compact ? 40 : 0),
          paddingHorizontal: theme.gutter + 4,
          paddingBottom: theme.spacing.xl,
          borderBottomLeftRadius: theme.radius.xl,
          borderBottomRightRadius: theme.radius.xl,
          backgroundColor: minimal ? c.surfaceAlt : c.primary,
        },
      ]}
    >
      <Animated.View
        key={source.id}
        entering={reduce ? undefined : FadeIn.duration(500)}
        style={StyleSheet.absoluteFill}
      >
        <HeroBackground theme={theme} />
        {asset?.kind === 'raster' ? (
          <RemoteImage uri={asset.uri} style={StyleSheet.absoluteFill} />
        ) : null}
        {asset?.kind === 'svg' ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <SvgUri
              uri={asset.uri}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            />
          </View>
        ) : null}
        <PatternBackground
          pattern={source.pattern}
          color={minimal ? c.primary : festive ? c.accent : c.onPrimary}
          opacity={minimal ? 0.07 : festive ? 0.18 : 0.1}
        />
        {!minimal ? (
          <Scrim
            color={c.heroOverlay}
            opacity={source.tokens.heroOverlayOpacity}
          />
        ) : null}
        <DecorationLayer
          decorations={source.decorations}
          surface={minimal ? 'light' : 'dark'}
        />
      </Animated.View>

      <Animated.View
        entering={reduce ? undefined : FadeInDown.duration(520).delay(80)}
        style={[
          styles.content,
          centered && styles.centered,
          { gap: theme.spacing.sm },
        ]}
      >
        {centered && !compact ? <Emblem theme={theme} /> : null}
        {eyebrow ? (
          festive ? (
            <View
              style={[
                styles.pill,
                { backgroundColor: c.accent, borderRadius: theme.radius.pill },
              ]}
            >
              <Text variant="label" color="onAccent">
                {eyebrow}
              </Text>
            </View>
          ) : (
            <Text
              variant="overline"
              color={minimal ? 'primary' : 'onPrimary'}
              style={!minimal && styles.soft}
            >
              {eyebrow}
            </Text>
          )
        ) : null}
        <Text
          variant={compact ? 'h1' : 'display'}
          color={textColor}
          align={centered ? 'center' : 'left'}
          accessibilityRole="header"
        >
          {heading}
        </Text>
        {centered ? <TriRule theme={theme} /> : null}
        {sub ? (
          <Text
            color={minimal ? 'muted' : 'onPrimary'}
            align={centered ? 'center' : 'left'}
            style={!minimal && styles.soft}
            numberOfLines={compact ? 2 : 4}
          >
            {sub}
          </Text>
        ) : null}
        {children ? (
          <View style={[styles.children, { marginTop: theme.spacing.sm }]}>
            {children}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', justifyContent: 'flex-end' },
  content: { alignSelf: 'stretch' },
  centered: { alignItems: 'center' },
  soft: { opacity: 0.92 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5 },
  emblem: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  triRule: { flexDirection: 'row', gap: 4, marginVertical: 2 },
  triSeg: { width: 22, height: 3, borderRadius: 2 },
  children: { alignSelf: 'stretch' },
});
