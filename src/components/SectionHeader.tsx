import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function SectionHeader({ title, overline, actionLabel, onAction }: { title: string; overline?: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { marginBottom: theme.spacing.md }]}>
      <View style={styles.flex}>
        {overline ? (
          <Text variant="overline" color="accent">
            {overline}
          </Text>
        ) : null}
        <Text variant="h3" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} hitSlop={10} accessibilityLabel={`${actionLabel}: ${title}`} style={styles.action}>
          <Text variant="label" color="primary">
            {actionLabel}
          </Text>
          <Icon icon={ArrowRight} size={16} color="primary" />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  flex: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32, paddingLeft: 8 },
});
