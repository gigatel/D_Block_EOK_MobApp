/* eslint-disable no-bitwise -- FNV-1a seed hashing */
import React, { memo, useId, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { PatternBackground } from '@/theme/patterns';
import type { PatternKey } from '@/theme/types';
import { Icon } from './Icon';

export type ArtCoverProps = {
  /** Deterministic variation seed (e.g. an id). */
  seed: string;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  radius?: number;
};

const PATTERNS: PatternKey[] = [
  'dots',
  'lattice',
  'rangoli',
  'blossom',
  'leaves',
  'waves',
  'paisley',
  'chakra',
];

/** FNV-1a. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Themed illustration for items without photos: seeded gradient + pattern + icon. */
export const ArtCover = memo(function ArtCoverImpl({
  seed,
  icon,
  style,
  radius = 0,
}: ArtCoverProps) {
  const theme = useTheme();
  const id = `ac${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const c = theme.colors;
  const look = useMemo(() => {
    const h = hash(seed);
    const pairs: [string, string][] = [
      [c.primaryDark, c.primary],
      [c.primary, c.secondary],
      [c.secondary, c.accent],
      [c.primaryDark, c.accent],
    ];
    const angle = (h % 4) as 0 | 1 | 2 | 3;
    const dirs = [
      { x1: '0', y1: '0', x2: '1', y2: '1' },
      { x1: '1', y1: '0', x2: '0', y2: '1' },
      { x1: '0', y1: '0', x2: '0', y2: '1' },
      { x1: '0', y1: '1', x2: '1', y2: '0' },
    ];
    return {
      pair: pairs[(h >>> 3) % pairs.length],
      dir: dirs[angle],
      pattern: PATTERNS[(h >>> 7) % PATTERNS.length],
    };
  }, [seed, c]);

  return (
    <View
      style={[styles.wrap, { borderRadius: radius }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} {...look.dir}>
            <Stop offset="0" stopColor={look.pair[0]} />
            <Stop offset="1" stopColor={look.pair[1]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <PatternBackground
        pattern={look.pattern}
        color={c.onPrimary}
        opacity={0.14}
      />
      {icon ? (
        <View style={styles.badge}>
          <Icon icon={icon} size={26} rawColor={c.onPrimary} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
