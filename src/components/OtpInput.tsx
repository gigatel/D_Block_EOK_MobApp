import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion, useTheme } from '@/theme';
import { Text } from './Text';

export type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  /** Increment to play the error shake. */
  errorTick?: number;
  hasError?: boolean;
  /** Code accepted: boxes turn green with a staggered bounce. */
  success?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
};

/**
 * 6-box OTP entry backed by one hidden input (supports SMS autofill / paste).
 * Tap any box to replace just that digit; backspace deletes from the cursor.
 */
export function OtpInput({ value, onChange, length = 6, errorTick = 0, hasError, success, autoFocus = true, onComplete }: OtpInputProps) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null);
  const x = useSharedValue(0);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  useEffect(() => {
    if (errorTick > 0 && !reduce) {
      x.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [errorTick, reduce, x]);

  // Cursor/selection inside the hidden input. A one-digit selection means "replace this box".
  const [sel, setSel] = useState({ start: value.length, end: value.length });
  const [focused, setFocused] = useState(autoFocus);

  // Value replaced from outside (SMS auto-fill, reset) → cursor to the end.
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setSel({ start: value.length, end: value.length });
    }
  }, [value]);

  const focusBox = (i: number) => {
    const at = Math.min(i, value.length);
    setSel(at < value.length ? { start: at, end: at + 1 } : { start: at, end: at });
    ref.current?.focus();
  };

  const digits = value.split('');
  const cursor = Math.min(sel.start, length - 1);
  return (
    <View accessibilityLabel={`One-time code, ${value.length} of ${length} digits entered`}>
      <Animated.View style={[styles.row, { gap: theme.spacing.sm }, shake]}>
        {Array.from({ length }, (_, i) => (
          <OtpBox
            key={i}
            index={i}
            digit={digits[i]}
            active={focused && i === cursor && !success}
            hasError={!!hasError}
            success={!!success}
            onPress={() => focusBox(i)}
          />
        ))}
      </Animated.View>
      <TextInput
        ref={ref}
        value={value}
        selection={sel}
        onSelectionChange={e => setSel(e.nativeEvent.selection)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={t => {
          const code = t.replace(/\D/g, '').slice(0, length);
          const replaced = sel.end - sel.start;
          const inserted = code.length - (value.length - replaced);
          const next = Math.max(0, Math.min(code.length, sel.start + Math.max(inserted, 0)));
          last.current = code;
          setSel({ start: next, end: next });
          onChange(code);
          if (code.length === length) onComplete?.(code);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={length}
        style={styles.hidden}
        caretHidden
      />
    </View>
  );
}

function OtpBox({
  index,
  digit,
  active,
  hasError,
  success,
  onPress,
}: {
  index: number;
  digit?: string;
  active: boolean;
  hasError: boolean;
  success: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const caret = useSharedValue(1);
  const c = theme.colors;

  // Pop when a digit lands in this box.
  useEffect(() => {
    if (digit && !reduce) {
      scale.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 10 }));
    }
  }, [digit, reduce, scale]);

  // Staggered bounce when the whole code is accepted.
  useEffect(() => {
    if (success && !reduce) {
      scale.value = withDelay(index * 60, withSequence(withTiming(1.15, { duration: 120 }), withSpring(1, { damping: 8 })));
    }
  }, [success, reduce, index, scale]);

  // Blinking caret in the active empty box.
  const showCaret = active && !digit;
  useEffect(() => {
    caret.value = showCaret && !reduce ? withRepeat(withSequence(withTiming(0, { duration: 450 }), withTiming(1, { duration: 450 })), -1) : 1;
  }, [showCaret, reduce, caret]);

  const boxAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const caretAnim = useAnimatedStyle(() => ({ opacity: caret.value }));

  const borderColor = success ? c.success : hasError ? c.danger : active ? c.primary : digit ? c.secondary : c.border;
  const backgroundColor = success ? c.successSoft : hasError ? c.dangerSoft : active ? c.primarySoft : c.surface;
  return (
    <Animated.View style={[styles.boxWrap, boxAnim]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Digit ${index + 1}${digit ? `, ${digit}` : ', empty'}. Tap to change.`}
        style={[
          styles.box,
          active || hasError || success ? styles.boxStrong : styles.boxSoft,
          {
            borderRadius: theme.radius.md,
            backgroundColor,
            borderColor,
          },
          active ? theme.shadow.card : null,
        ]}>
        {digit ? (
          <Text variant="h2" color={success ? 'success' : 'text'}>
            {digit}
          </Text>
        ) : showCaret ? (
          <Animated.View style={[styles.caret, { backgroundColor: c.primary }, caretAnim]} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  boxWrap: { flex: 1, maxWidth: 54 },
  box: { aspectRatio: 0.82, alignItems: 'center', justifyContent: 'center' },
  boxStrong: { borderWidth: 2 },
  boxSoft: { borderWidth: 1.5 },
  caret: { width: 2, height: 24, borderRadius: 1 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
