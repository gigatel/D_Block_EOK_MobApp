import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg';
import { useReduceMotion, useTheme } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

/** Perimeter of the "D" outline below (2×200 straight + 512 spine + π·256 arc). */
const D_LENGTH = 1716;

/**
 * The app-icon mark (gold "D" around a residential block) drawn in theme
 * colours. On mount the D traces itself and the building rises into place.
 */
export function BrandLogo({ size = 88 }: { size?: number }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const draw = useSharedValue(reduce ? 1 : 0);
  const rise = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) return;
    draw.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    rise.value = withDelay(450, withSpring(1, { damping: 14, stiffness: 120 }));
  }, [reduce, draw, rise]);

  const dProps = useAnimatedProps(() => ({ strokeDashoffset: D_LENGTH * (1 - draw.value) }));
  const buildingProps = useAnimatedProps(() => ({ opacity: rise.value }));
  const lift = useAnimatedStyle(() => ({
    transform: [{ scale: 0.86 + 0.14 * rise.value }],
  }));

  const c = theme.colors;
  return (
    <Animated.View style={lift} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={size} height={size} viewBox="232 216 560 592">
        <AnimatedPath
          d="M286 256 H486 A256 256 0 0 1 486 768 H286 Z"
          fill="none"
          stroke={c.accent}
          strokeWidth={56}
          strokeLinejoin="round"
          strokeDasharray={D_LENGTH}
          animatedProps={dProps}
        />
        <AnimatedG animatedProps={buildingProps}>
          <Polygon
            points="372,458 490,360 608,458"
            fill={c.background}
            stroke={c.background}
            strokeWidth={14}
            strokeLinejoin="round"
          />
          <Rect x={400} y={450} width={180} height={244} fill={c.background} />
          <Circle cx={490} cy={420} r={15} fill={c.primary} />
          <Rect x={426} y={478} width={42} height={42} rx={5} fill={c.primary} />
          <Rect x={512} y={478} width={42} height={42} rx={5} fill={c.primary} />
          <Rect x={426} y={542} width={42} height={42} rx={5} fill={c.primary} />
          <Rect x={512} y={542} width={42} height={42} rx={5} fill={c.primary} />
          <Path d="M466 694 V630 A24 24 0 0 1 514 630 V694 Z" fill={c.primary} />
          <Rect x={362} y={686} width={252} height={18} rx={9} fill={c.accent} />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
