import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useReduceMotion, useTheme } from '../ThemeProvider';
import type { DecorationKey } from '../types';
import {
  ColourSplash,
  DiyaRow,
  Fireworks,
  Kites,
  MarigoldGarland,
  TricolourBunting,
} from './festive';
import { useAppActive, useSafeIsFocused, type DecoProps } from './shared';
import {
  Clouds,
  FallingLeaves,
  Fog,
  Lightning,
  Petals,
  Rain,
  Snowfall,
  SunRays,
} from './weather';

export type DecorationLayerProps = {
  decorations: DecorationKey[];
  /** Pause animations (e.g. screen not focused). */
  paused?: boolean;
  /** 'hero' = full overlay; 'strip' = compact top strip. */
  variant?: 'hero' | 'strip';
  /**
   * Background the layer sits on: 'dark' (default for hero) draws light ink for
   * rain/snow/fog/clouds; 'light' (default for strip) draws in the theme colour.
   */
  surface?: 'dark' | 'light';
};

/** Built-in decorations, chosen by key only. Unknown keys are ignored. */
const REGISTRY: Record<DecorationKey, React.ComponentType<DecoProps>> = {
  'marigold-garland': MarigoldGarland,
  'diya-row': DiyaRow,
  fireworks: Fireworks,
  'colour-splash': ColourSplash,
  'tricolour-bunting': TricolourBunting,
  kites: Kites,
  snowfall: Snowfall,
  rain: Rain,
  lightning: Lightning,
  fog: Fog,
  clouds: Clouds,
  'falling-leaves': FallingLeaves,
  petals: Petals,
  'sun-rays': SunRays,
};

/** Draw order: backgrounds (sky effects) first, foreground garlands last. */
const ORDER: DecorationKey[] = [
  'sun-rays',
  'clouds',
  'fog',
  'lightning',
  'colour-splash',
  'fireworks',
  'kites',
  'rain',
  'snowfall',
  'falling-leaves',
  'petals',
  'diya-row',
  'tricolour-bunting',
  'marigold-garland',
];

export const STRIP_HEIGHT = 72;

/**
 * Animated, non-interactive decoration overlay. Animations run on the UI thread
 * and pause when `paused`, when the screen loses focus, or when the app is in
 * the background. With reduce-motion on, a static frame is shown.
 */
export function DecorationLayer({
  decorations,
  paused,
  variant = 'hero',
  surface,
}: DecorationLayerProps) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const focused = useSafeIsFocused();
  const appActive = useAppActive();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const strip = variant === 'strip';
  const onDark = (surface ?? (strip ? 'light' : 'dark')) === 'dark';
  const ink = onDark ? '#FFFFFF' : theme.colors.primary;
  const active = !paused && focused && appActive && !reduce;
  const keys = ORDER.filter(k => decorations.includes(k) && REGISTRY[k]);

  if (keys.length === 0) {
    return null;
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) > 1 || Math.abs(height - size.h) > 1) {
      setSize({ w: width, h: height });
    }
  };

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      style={strip ? styles.strip : styles.fill}
    >
      {size.w > 0
        ? keys.map(k => {
            const C = REGISTRY[k];
            return (
              <C
                key={k}
                width={size.w}
                height={size.h}
                active={active}
                reduce={reduce}
                strip={strip}
                ink={ink}
              />
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STRIP_HEIGHT,
    overflow: 'hidden',
  },
});
