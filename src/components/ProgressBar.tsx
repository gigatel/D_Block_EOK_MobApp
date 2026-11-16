import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useReduceMotion, useTheme, type AppColors } from '@/theme';

export function ProgressBar({ value, color = 'primary', height = 8 }: { value: number; color?: keyof AppColors; height?: number }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const bar = useAnimatedStyle(() => ({ width: reduce ? `${pct}%` : withTiming(`${pct}%`, { duration: 450 }) }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height, borderRadius: height / 2, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: theme.colors[color] }, bar]} />
    </View>
  );
}
