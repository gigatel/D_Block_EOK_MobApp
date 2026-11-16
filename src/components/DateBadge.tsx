import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { dateBadge } from '@/utils/date';
import { Text } from './Text';

/** Calendar tile: NOV / 08 / SUN. */
export function DateBadge({ date, variant = 'solid' }: { date: string; variant?: 'solid' | 'light' }) {
  const theme = useTheme();
  const b = dateBadge(date);
  const solid = variant === 'solid';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.wrap, { borderRadius: theme.radius.md, backgroundColor: solid ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border, borderWidth: solid ? 0 : 1 }]}>
      <Text variant="overline" color={solid ? 'onPrimary' : 'accent'} style={styles.month}>
        {b.month}
      </Text>
      <Text variant="h2" color={solid ? 'onPrimary' : 'text'} style={styles.day}>
        {b.day}
      </Text>
      <Text variant="caption" color={solid ? 'onPrimary' : 'muted'} style={styles.wd}>
        {b.weekday}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 58, paddingVertical: 6, alignItems: 'center' },
  month: { letterSpacing: 1 },
  day: { marginVertical: -2 },
  wd: { fontSize: 10, opacity: 0.85 },
});
