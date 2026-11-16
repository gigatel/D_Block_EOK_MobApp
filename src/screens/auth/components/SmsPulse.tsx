import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { CircleCheck, MessageSquareText } from 'lucide-react-native';
import { Icon } from '@/components';
import { useReduceMotion, useTheme, withAlpha } from '@/theme';

const SIZE = 84;

function Ring({ t, color }: { t: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 0.9 }],
  }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

/** SMS icon with radiating rings while waiting for the code; a check once verified. */
export function SmsPulse({ success }: { success?: boolean }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const pop = useSharedValue(reduce ? 1 : 0.6);

  useEffect(() => {
    if (!reduce) pop.value = withSpring(1, { damping: 12 });
  }, [reduce, pop]);

  useEffect(() => {
    if (reduce || success) {
      a.value = withTiming(1, { duration: 200 });
      b.value = withTiming(1, { duration: 200 });
      return;
    }
    const loop = () => withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1, false);
    a.value = 0;
    b.value = 0;
    a.value = loop();
    b.value = withDelay(1000, loop());
  }, [reduce, success, a, b]);

  useEffect(() => {
    if (success && !reduce) {
      pop.value = withSpring(1.12, { damping: 6 }, () => {
        pop.value = withSpring(1);
      });
    }
  }, [success, reduce, pop]);

  const badge = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const c = theme.colors;
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no">
      <Ring t={a} color={c.accent} />
      <Ring t={b} color={c.onPrimary} />
      <Animated.View
        style={[
          styles.badge,
          badge,
          {
            backgroundColor: success ? c.success : withAlpha(c.onPrimary, 0.14),
            borderColor: success ? c.success : withAlpha(c.accent, 0.8),
          },
        ]}
      >
        <Icon icon={success ? CircleCheck : MessageSquareText} size={34} color="onPrimary" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE * 1.9, height: SIZE * 1.5, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2 },
  badge: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
