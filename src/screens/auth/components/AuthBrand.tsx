import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components';
import { useTheme } from '@/theme';

/** Inline error/notice banner for forms. */
export function FormBanner({
  message,
  tone = 'danger',
}: {
  message: string;
  tone?: 'danger' | 'warning' | 'info';
}) {
  const theme = useTheme();
  const bg =
    tone === 'danger'
      ? theme.colors.dangerSoft
      : tone === 'warning'
      ? theme.colors.warningSoft
      : theme.colors.infoSoft;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: bg,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}
    >
      <Text variant="small" color={tone}>
        {message}
      </Text>
    </View>
  );
}
