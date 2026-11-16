import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type AppColors } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icons always need an accessible label. */
  label: string;
  onPress?: () => void;
  variant?: 'plain' | 'tonal' | 'surface' | 'glass';
  color?: keyof AppColors;
  /** Raw colour override (e.g. white over photos). */
  rawColor?: string;
  size?: number;
  badge?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, label, onPress, variant = 'plain', color = 'text', rawColor, size = 22, badge, style }: IconButtonProps) {
  const theme = useTheme();
  const bg =
    variant === 'tonal'
      ? theme.colors.primarySoft
      : variant === 'surface'
      ? theme.colors.surface
      : variant === 'glass'
      ? 'rgba(255,255,255,0.22)'
      : 'transparent';
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      hitSlop={6}
      scaleTo={0.9}
      style={[
        styles.base,
        { width: theme.touchTarget, height: theme.touchTarget, backgroundColor: bg },
        variant === 'surface' ? theme.shadow.card : null,
        style,
      ]}>
      <Icon icon={icon} size={size} color={color} rawColor={rawColor} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.danger, borderColor: theme.colors.surface }]}>
          <Text variant="caption" style={styles.badgeText}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 12, fontWeight: '700' },
});
