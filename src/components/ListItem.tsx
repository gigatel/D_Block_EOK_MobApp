import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme, type AppColors } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: keyof AppColors;
  iconBg?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  accessibilityHint?: string;
};

export function ListItem({ title, subtitle, icon, iconColor = 'primary', iconBg, left, right, onPress, chevron = !!onPress, destructive, accessibilityHint }: ListItemProps) {
  const theme = useTheme();
  const content = (
    <>
      {left ??
        (icon ? (
          <View style={[styles.iconWrap, { backgroundColor: iconBg ?? (destructive ? theme.colors.dangerSoft : theme.colors.primarySoft), borderRadius: theme.radius.md }]}>
            <Icon icon={icon} size={20} color={destructive ? 'danger' : iconColor} />
          </View>
        ) : null)}
      <View style={styles.text}>
        <Text variant="bodyStrong" color={destructive ? 'danger' : 'text'} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" color="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon icon={ChevronRight} size={18} color="muted" /> : null}
    </>
  );
  const style = [styles.row, { minHeight: theme.touchTarget + 12, paddingVertical: theme.spacing.sm, gap: theme.spacing.md }];
  return onPress ? (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title} accessibilityHint={accessibilityHint} style={style}>
      {content}
    </PressableScale>
  ) : (
    <View style={style} accessible accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
