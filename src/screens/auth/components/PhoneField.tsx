import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { CircleCheck } from 'lucide-react-native';
import { Icon, Text } from '@/components';
import { useReduceMotion, useTheme } from '@/theme';

/** Keep the 10-digit national number; drops a pasted +91/91/0 prefix. */
export function normalisePhoneDigits(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

/** "9876543210" → "98765 43210". */
export const formatPhone = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

/**
 * Large Indian mobile-number field: fixed +91 prefix, grouped digits,
 * animated focus ring, a check mark once complete and a shake on error.
 */
export function PhoneField({
  value,
  onChange,
  onSubmit,
  error,
  errorTick = 0,
  autoFocus,
}: {
  value: string;
  onChange: (digits: string) => void;
  onSubmit?: () => void;
  error?: string;
  errorTick?: number;
  autoFocus?: boolean;
}) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const c = theme.colors;
  const complete = value.length === 10;

  useEffect(() => {
    focus.value = reduce ? (focused ? 1 : 0) : withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, reduce, focus]);

  useEffect(() => {
    if (errorTick > 0 && !reduce) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [errorTick, reduce, shakeX]);

  const ring = useAnimatedStyle(() => ({
    borderColor: error ? c.danger : interpolateColor(focus.value, [0, 1], [c.border, c.primary]),
    borderWidth: 1.5 + focus.value * 0.5,
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label">Mobile number</Text>
      <Pressable onPress={() => ref.current?.focus()} accessible={false}>
        <Animated.View
          style={[
            styles.field,
            focused ? theme.shadow.card : null,
            { backgroundColor: c.surface, borderRadius: theme.radius.lg, paddingHorizontal: theme.spacing.lg },
            ring,
          ]}
        >
          <Text variant="title" accessibilityLabel="India, plus 91">
            +91
          </Text>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <TextInput
            ref={ref}
            value={formatPhone(value)}
            onChangeText={t => onChange(normalisePhoneDigits(t))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmit}
            placeholder="Enter mobile number"
            placeholderTextColor={c.muted}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            returnKeyType="done"
            maxLength={16}
            autoFocus={autoFocus}
            accessibilityLabel="Mobile number"
            accessibilityHint="Your 10-digit mobile number registered with the RWA"
            style={[theme.type.title, styles.input, { color: c.text }]}
          />
          {complete ? (
            <Animated.View entering={reduce ? undefined : ZoomIn.springify()} exiting={reduce ? undefined : ZoomOut}>
              <Icon icon={CircleCheck} color="success" size={22} />
            </Animated.View>
          ) : null}
        </Animated.View>
      </Pressable>
      {error ? (
        <Animated.View entering={reduce ? undefined : FadeIn} exiting={reduce ? undefined : FadeOut}>
          <Text variant="caption" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        </Animated.View>
      ) : (
        <Text variant="caption" color="muted">
          The number registered with the RWA office
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', height: 62, gap: 12 },
  divider: { width: 1, height: 26 },
  input: { flex: 1, paddingVertical: 0, fontSize: 19, letterSpacing: 0.5 },
});
