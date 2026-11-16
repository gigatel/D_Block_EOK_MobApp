import React, { useEffect, useRef } from 'react';
import { ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { PressableScale, Text } from '@/components';
import { formatMinutes } from '@/features/admin/helpers';
import { useTheme } from '@/theme';

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const ITEM = 64;

function parts(dayKey: string) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { day: d, month: MONTHS[m - 1], weekday: DAYS[wd] };
}

/** Horizontal calendar strip of IST day keys. */
export function DayStrip({
  label,
  days,
  value,
  onChange,
}: {
  label: string;
  days: string[];
  value: string;
  onChange: (d: string) => void;
}) {
  const theme = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    const idx = days.indexOf(value);
    if (idx > 2)
      setTimeout(
        () =>
          ref.current?.scrollTo({ x: (idx - 2) * (ITEM + 8), animated: false }),
        50,
      );
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.gap8}>
      <Text variant="label">{label}</Text>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: theme.gutter }}
        style={{ marginHorizontal: -theme.gutter }}
      >
        {days.map(d => {
          const p = parts(d);
          const on = d === value;
          return (
            <PressableScale
              key={d}
              onPress={() => onChange(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${p.weekday} ${p.day} ${p.month}`}
              style={[
                styles.day,
                {
                  width: ITEM,
                  borderRadius: theme.radius.md,
                  backgroundColor: on
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: on ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text variant="caption" color={on ? 'onPrimary' : 'muted'}>
                {p.weekday}
              </Text>
              <Text variant="h3" color={on ? 'onPrimary' : 'text'}>
                {p.day}
              </Text>
              <Text
                variant="caption"
                color={on ? 'onPrimary' : 'accent'}
                style={styles.month}
              >
                {p.month}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Horizontal list of time slots (minutes after midnight, IST). */
export function TimeStrip({
  label,
  slots,
  value,
  onChange,
  error,
}: {
  label: string;
  slots: number[];
  value: number;
  onChange: (m: number) => void;
  error?: string;
}) {
  const theme = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    const idx = slots.indexOf(value);
    if (idx > 2)
      setTimeout(
        () => ref.current?.scrollTo({ x: (idx - 2) * 92, animated: false }),
        50,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.gap8}>
      <Text variant="label">{label}</Text>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: theme.gutter }}
        style={{ marginHorizontal: -theme.gutter }}
      >
        {slots.map(m => {
          const on = m === value;
          return (
            <PressableScale
              key={m}
              onPress={() => onChange(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={formatMinutes(m)}
              style={[
                styles.time,
                {
                  minHeight: theme.touchTarget,
                  borderRadius: theme.radius.pill,
                  backgroundColor: on
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: on ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text variant="label" color={on ? 'onPrimary' : 'text'}>
                {formatMinutes(m)}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  day: { alignItems: 'center', paddingVertical: 8, borderWidth: 1 },
  month: { fontWeight: '700', letterSpacing: 1 },
  time: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
