import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useReduceMotion, useTheme } from '@/theme';

/** Shimmering placeholder block. */
export function Skeleton({ width = '100%', height = 16, radius, style }: { width?: DimensionValue; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (!reduce) {
      o.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true);
    }
  }, [o, reduce]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      style={[{ width, height, borderRadius: radius ?? theme.radius.sm, backgroundColor: theme.colors.surfaceAlt }, a, style]}
    />
  );
}

/** A list of card-shaped skeletons for loading screens. */
export function SkeletonList({ count = 4, height = 92 }: { count?: number; height?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} radius={theme.radius.lg} />
      ))}
    </View>
  );
}
