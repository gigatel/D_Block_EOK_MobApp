import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { Icon } from './Icon';
import { Text } from './Text';

export function SwitchRow({ title, subtitle, value, onChange, icon, disabled }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; icon?: LucideIcon; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { minHeight: theme.touchTarget + 8, gap: theme.spacing.md }]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.md }]}>
          <Icon icon={icon} size={19} color="primary" />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="small" color="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={disabled}
        onValueChange={v => {
          haptic('selection');
          onChange(v);
        }}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
