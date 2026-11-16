import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton, Text } from '@/components';
import { useReduceMotion, useTheme, withAlpha } from '@/theme';
import { PatternBackground } from '@/theme/patterns';

/** Space the overlapping sheet covers at the bottom of the hero. */
export const SHEET_OVERLAP = 32;

/** Soft light orb that drifts slowly (purely decorative). */
function Orb({
  size,
  color,
  style,
  delay,
  drift,
}: {
  size: number;
  color: string;
  style: object;
  delay: number;
  drift: number;
}) {
  const reduce = useReduceMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [reduce, delay, t]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: -drift * t.value }, { translateX: (drift / 2) * t.value }],
    opacity: 0.55 + 0.45 * t.value,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
        anim,
      ]}
    />
  );
}

/**
 * Branded top section for the sign-in screens: theme gradient + pattern,
 * drifting orbs, a centrepiece (logo or icon) and titles.
 */
export function AuthHero({
  centerpiece,
  title,
  subtitle,
  onBack,
  compact,
}: {
  centerpiece: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const gradId = 'authHeroGrad';

  return (
    <View
      style={[
        styles.hero,
        {
          paddingTop: insets.top + (onBack ? theme.spacing.xs : theme.spacing.xxl),
          paddingBottom: SHEET_OVERLAP + (compact ? theme.spacing.xl : theme.spacing.xxl),
          backgroundColor: c.primary,
        },
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.secondary} />
              <Stop offset="0.55" stopColor={c.primary} />
              <Stop offset="1" stopColor={c.heroOverlay} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradId})`} />
        </Svg>
        <PatternBackground pattern={theme.source.pattern} color={c.onPrimary} opacity={0.07} />
        <Orb size={180} color={withAlpha(c.accent, 0.16)} style={styles.orbA} delay={0} drift={14} />
        <Orb size={120} color={withAlpha(c.onPrimary, 0.08)} style={styles.orbB} delay={900} drift={18} />
        <Orb size={70} color={withAlpha(c.accent, 0.2)} style={styles.orbC} delay={1600} drift={10} />
      </View>

      {onBack ? (
        <View style={[styles.backRow, { paddingHorizontal: theme.spacing.sm }]}>
          <IconButton icon={ChevronLeft} label="Back" variant="glass" color="onPrimary" onPress={onBack} />
        </View>
      ) : null}

      <View style={[styles.center, { gap: theme.spacing.md, paddingHorizontal: theme.gutter + 8 }]}>
        {centerpiece}
        <Animated.View
          entering={reduce ? undefined : FadeInDown.delay(250).duration(500)}
          style={[styles.center, { gap: theme.spacing.xs }]}
        >
          <Text variant="overline" color="accent" align="center">
            D Block · East of Kailash
          </Text>
          <Text variant={compact ? 'h1' : 'display'} color="onPrimary" align="center" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text color="onPrimary" align="center" style={styles.soft}>
              {subtitle}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  orb: { position: 'absolute' },
  backRow: { flexDirection: 'row', marginBottom: 4 },
  center: { alignItems: 'center' },
  soft: { opacity: 0.85 },
  orbA: { top: -50, right: -40 },
  orbB: { bottom: 30, left: -30 },
  orbC: { top: 90, left: 40 },
});
