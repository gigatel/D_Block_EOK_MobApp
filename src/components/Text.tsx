import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme, type AppColors, type TypeVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: keyof AppColors;
  align?: 'auto' | 'left' | 'center' | 'right';
};

/** Theme-aware text. Respects the user's font scaling (dynamic type). */
export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[theme.type[variant], { color: theme.colors[color] }, align ? { textAlign: align } : null, style]}
    />
  );
}
