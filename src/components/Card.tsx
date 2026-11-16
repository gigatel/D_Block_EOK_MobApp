import React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

export type CardProps = ViewProps & {
  variant?: 'elevated' | 'outlined' | 'tinted' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Rounded surface with soft shadow. Becomes pressable when onPress is given. */
export function Card({ variant = 'elevated', padding = 'md', onPress, style, children, accessibilityLabel, ...rest }: CardProps) {
  const theme = useTheme();
  const pad = padding === 'none' ? 0 : padding === 'sm' ? theme.spacing.md : padding === 'lg' ? theme.spacing.xl : theme.spacing.lg;
  const look: ViewStyle = {
    borderRadius: theme.radius.lg,
    padding: pad,
    backgroundColor:
      variant === 'tinted' ? theme.colors.surfaceAlt : variant === 'accent' ? theme.colors.accentSoft : theme.colors.surface,
    borderWidth: variant === 'outlined' || variant === 'elevated' ? 1 : 0,
    borderColor: theme.colors.border,
  };
  const shadow = variant === 'elevated' ? theme.shadow.card : null;
  if (onPress) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} style={[look, shadow, style]} {...rest}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={[look, shadow, style]} accessibilityLabel={accessibilityLabel} {...rest}>
      {children}
    </View>
  );
}
