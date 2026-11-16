import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  count?: number;
};

export function Chip({ label, selected, onPress, icon, count }: ChipProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      style={[
        styles.chip,
        {
          minHeight: 38,
          borderRadius: theme.radius.pill,
          backgroundColor: selected ? c.primary : c.surface,
          borderColor: selected ? c.primary : c.border,
        },
      ]}>
      {icon ? <Icon icon={icon} size={15} color={selected ? 'onPrimary' : 'muted'} /> : null}
      <Text variant="label" color={selected ? 'onPrimary' : 'text'}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" color={selected ? 'onPrimary' : 'muted'} style={styles.count}>
          {count}
        </Text>
      ) : null}
    </PressableScale>
  );
}

/** Horizontally scrolling single-select chip row. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  counts,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.gutter }}
      style={{ marginHorizontal: -theme.gutter, flexGrow: 0 }}>
      {options.map(o => (
        <Chip key={o} label={o} selected={o === value} onPress={() => onChange(o)} count={counts?.[o]} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderWidth: 1 },
  count: { fontWeight: '700' },
});
