import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLightStatusBar } from '@/hooks/useStatusBar';
import { useReduceMotion, useTheme } from '@/theme';
import { SHEET_OVERLAP } from './AuthHero';

/** Full-screen sign-in layout: branded hero on top, rounded sheet sliding up over it. */
export function AuthLayout({ hero, children }: { hero: React.ReactNode; children: React.ReactNode }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  useLightStatusBar();

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.primary }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.grow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {hero}
          <Animated.View
            entering={reduce ? undefined : FadeInUp.delay(120).duration(550).springify().damping(18)}
            style={[
              styles.sheet,
              theme.shadow.raised,
              {
                marginTop: -SHEET_OVERLAP,
                backgroundColor: theme.colors.background,
                borderTopLeftRadius: theme.radius.xl + 8,
                borderTopRightRadius: theme.radius.xl + 8,
                paddingHorizontal: theme.gutter + 8,
                paddingTop: theme.spacing.xxl,
                paddingBottom: insets.bottom + theme.spacing.xl,
                gap: theme.spacing.lg,
              },
            ]}
          >
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  sheet: { flexGrow: 1 },
});
