import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReduceMotion } from '@/theme';

/** Staggered fade-up entrance. Disabled when reduce-motion is on. */
export function Appear({ index = 0, children, style }: { index?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.delay(Math.min(index, 8) * 55).duration(420).springify().damping(18)}
      style={style}>
      {children}
    </Animated.View>
  );
}
