import React from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type AppColors } from '@/theme';

export type IconProps = {
  icon: LucideIcon;
  size?: number;
  color?: keyof AppColors;
  /** Raw colour override (e.g. on images). */
  rawColor?: string;
  strokeWidth?: number;
};

/** Single icon family (lucide). Decorative by default — label the parent control. */
export function Icon({ icon: Glyph, size = 22, color = 'text', rawColor, strokeWidth = 1.9 }: IconProps) {
  const theme = useTheme();
  return (
    <Glyph
      size={size}
      color={rawColor ?? theme.colors[color]}
      strokeWidth={strokeWidth}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
