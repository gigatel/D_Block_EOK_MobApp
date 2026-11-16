import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type AppColors } from '@/theme';
import type { ComplaintStatus, Priority } from '@/types/models';
import { Icon } from './Icon';
import { Text } from './Text';

export type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function toneColors(tone: Tone, c: AppColors): { bg: string; fg: keyof AppColors } {
  switch (tone) {
    case 'primary': return { bg: c.primarySoft, fg: 'primary' };
    case 'accent': return { bg: c.accentSoft, fg: 'text' };
    case 'success': return { bg: c.successSoft, fg: 'success' };
    case 'warning': return { bg: c.warningSoft, fg: 'warning' };
    case 'danger': return { bg: c.dangerSoft, fg: 'danger' };
    case 'info': return { bg: c.infoSoft, fg: 'info' };
    default: return { bg: c.surfaceAlt, fg: 'muted' };
  }
}

export const STATUS_TONE: Record<ComplaintStatus, Tone> = {
  Open: 'info',
  'In Progress': 'warning',
  Resolved: 'success',
  Closed: 'neutral',
};
export const PRIORITY_TONE: Record<Priority, Tone> = { Low: 'neutral', Medium: 'info', High: 'warning', Urgent: 'danger' };

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: LucideIcon }) {
  const theme = useTheme();
  const t = toneColors(tone, theme.colors);
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderRadius: theme.radius.pill }]}>
      {icon ? <Icon icon={icon} size={13} color={t.fg} strokeWidth={2.2} /> : null}
      <Text variant="caption" color={t.fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  text: { fontWeight: '700' },
});
