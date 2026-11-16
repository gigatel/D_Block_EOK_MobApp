import React, { useContext, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export type ScreenProps = {
  children: React.ReactNode;
  /** Rendered above the scroll area (e.g. <Header />). */
  header?: React.ReactNode;
  scroll?: boolean;
  /** Pull-to-refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Remove the default gutter (for full-bleed heroes). */
  bleed?: boolean;
  /** Pad for the top safe area when there is no header. */
  safeTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
};

/**
 * Standard page: themed background, safe areas (edge-to-edge on Android),
 * keyboard avoidance, pull-to-refresh and floating-tab-bar padding.
 */
export function Screen({
  children,
  header,
  scroll = true,
  refreshing = false,
  onRefresh,
  bleed,
  safeTop,
  contentStyle,
  footer,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const bottom = Math.max(tabBar, insets.bottom) + theme.spacing.xl;
  // Show the spinner only for a user pull — not for background refetches.
  const [pulled, setPulled] = useState(false);
  useEffect(() => {
    if (!refreshing) setPulled(false);
  }, [refreshing]);
  const pad: ViewStyle = {
    paddingHorizontal: bleed ? 0 : theme.gutter,
    paddingTop:
      safeTop && !header ? insets.top + theme.spacing.md : theme.spacing.md,
    paddingBottom: footer ? theme.spacing.lg : bottom,
    gap: theme.spacing.lg,
  };
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {header}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[pad, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={pulled && refreshing}
                  onRefresh={() => {
                    setPulled(true);
                    onRefresh();
                  }}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, pad, contentStyle]}>{children}</View>
        )}
        {footer ? (
          <View
            style={[
              styles.footer,
              {
                paddingHorizontal: theme.gutter,
                paddingBottom: tabBar
                  ? tabBar + theme.spacing.sm
                  : Math.max(insets.bottom, theme.spacing.md),
                paddingTop: theme.spacing.md,
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
});
