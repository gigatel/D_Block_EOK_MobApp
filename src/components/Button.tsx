import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type AppColors } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'soft';
type Size = 'md' | 'sm' | 'lg';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const palette: Record<Variant, { bg: string; fg: keyof AppColors; border: string }> = {
    primary: { bg: c.primary, fg: 'onPrimary', border: c.primary },
    secondary: { bg: c.surface, fg: 'primary', border: c.border },
    accent: { bg: c.accent, fg: 'onAccent', border: c.accent },
    ghost: { bg: 'transparent', fg: 'primary', border: 'transparent' },
    danger: { bg: c.danger, fg: 'onPrimary', border: c.danger },
    soft: { bg: c.primarySoft, fg: 'primary', border: 'transparent' },
  };
  const p = palette[variant];
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : theme.touchTarget + 4;
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        {
          minHeight: Math.max(height, size === 'sm' ? 40 : theme.touchTarget),
          paddingHorizontal: size === 'sm' ? theme.spacing.md : theme.spacing.xl,
          borderRadius: theme.radius.md,
          backgroundColor: p.bg,
          borderColor: p.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        variant === 'primary' || variant === 'accent' ? theme.shadow.card : null,
        fullWidth ? styles.full : styles.inline,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c[p.fg]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon icon={icon} size={size === 'sm' ? 16 : 19} color={p.fg} /> : null}
          <Text variant={size === 'sm' ? 'label' : 'bodyStrong'} color={p.fg} numberOfLines={1}>
            {title}
          </Text>
          {iconRight ? <Icon icon={iconRight} size={size === 'sm' ? 16 : 19} color={p.fg} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
