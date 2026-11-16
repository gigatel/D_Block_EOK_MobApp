import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useReduceMotion, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Small circular timer that empties smoothly as `remaining` counts down to 0. */
export function CountdownRing({ remaining, total, size = 22 }: { remaining: number; total: number; size?: number }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const p = useSharedValue(fraction);

  useEffect(() => {
    // Each tick is one second: glide to the next value over that second.
    p.value = reduce ? fraction : withTiming(fraction, { duration: 950, easing: Easing.linear });
  }, [fraction, reduce, p]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.border} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={theme.colors.primary}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        animatedProps={props}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
