import { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

/** Content padding for FlatLists so the last item clears the floating tab bar / home indicator. */
export function useListPadding() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  return {
    paddingHorizontal: theme.gutter,
    paddingTop: theme.spacing.md,
    paddingBottom: Math.max(tabBar, insets.bottom) + theme.spacing.xl,
    gap: theme.spacing.md,
  };
}

/** Screen contentStyle for screens whose body is a FlatList. */
export const listScreenContent = StyleSheet.create({
  c: { paddingTop: 0, paddingBottom: 0, gap: 0 },
}).c;
