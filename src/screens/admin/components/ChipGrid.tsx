import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from '@/components';
import { useTheme } from '@/theme';

/** Wrapping single-select chip group with a label (for forms). */
export function ChipGrid<T extends string>({
  label,
  options,
  value,
  onChange,
  labels,
  error,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
  error?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={styles.gap8}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      <Text variant="label">{label}</Text>
      <View style={[styles.wrap, { gap: theme.spacing.sm }]}>
        {options.map(o => (
          <Chip
            key={o}
            label={labels?.[o] ?? o}
            selected={o === value}
            onPress={() => onChange(o)}
          />
        ))}
      </View>
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
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
