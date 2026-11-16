import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { toneColors, type Tone } from './Badge';
import { Card } from './Card';
import { Icon } from './Icon';
import { Text } from './Text';

export function StatTile({ label, value, icon, tone = 'primary', onPress, hint }: { label: string; value: string | number; icon: LucideIcon; tone?: Tone; onPress?: () => void; hint?: string }) {
  const theme = useTheme();
  const t = toneColors(tone, theme.colors);
  return (
    <Card onPress={onPress} style={styles.tile} accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <View style={[styles.icon, { backgroundColor: t.bg, borderRadius: theme.radius.md }]}>
        <Icon icon={icon} size={20} color={t.fg} />
      </View>
      <Text variant="h1" style={styles.value}>
        {value}
      </Text>
      <Text variant="small" color="muted" numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text variant="caption" color={t.fg} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 140, gap: 4 },
  icon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  value: { marginTop: 2 },
});
