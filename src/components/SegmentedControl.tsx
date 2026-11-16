import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useReduceMotion, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { Text } from './Text';

/** Animated pill segmented control (2–4 options). */
export function SegmentedControl<T extends string>({ options, value, onChange, labels }: { options: readonly T[]; value: T; onChange: (v: T) => void; labels?: Partial<Record<T, string>> }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const idx = Math.max(0, options.indexOf(value));
  const seg = width / options.length;
  const pill = useAnimatedStyle(() => ({
    width: seg - 6,
    transform: [{ translateX: reduce ? idx * seg : withSpring(idx * seg, { damping: 20, stiffness: 220 }) }],
  }));
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.wrap, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill, minHeight: theme.touchTarget }]}>
      {width > 0 ? <Animated.View style={[styles.pill, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill }, theme.shadow.card, pill]} /> : null}
      {options.map(o => (
        <Pressable
          key={o}
          accessibilityRole="tab"
          accessibilityState={{ selected: o === value }}
          onPress={() => {
            haptic('selection');
            onChange(o);
          }}
          style={styles.seg}>
          <Text variant="label" color={o === value ? 'primary' : 'muted'}>
            {labels?.[o] ?? o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 3 },
  pill: { position: 'absolute', top: 3, bottom: 3, left: 3 },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
});
