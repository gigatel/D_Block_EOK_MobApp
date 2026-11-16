import { useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme';

/** Responsive column count + item width for grids (phones 2, small tablets 3, large 4). */
export function useGrid({
  phone = 2,
  tablet = 3,
  large = 4,
  gap,
}: { phone?: number; tablet?: number; large?: number; gap?: number } = {}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? large : width >= 600 ? tablet : phone;
  const g = gap ?? theme.spacing.md;
  const itemWidth = Math.floor(
    (width - theme.gutter * 2 - g * (columns - 1)) / columns,
  );
  return { columns, itemWidth, gap: g };
}
