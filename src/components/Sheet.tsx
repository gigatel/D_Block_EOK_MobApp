import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion, useTheme } from '@/theme';
import { Text } from './Text';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Bottom sheet with backdrop fade + slide-up, keyboard aware. */
export function Sheet({ visible, onClose, title, subtitle, children, footer }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: reduce ? 0 : 280, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: reduce ? 0 : 200 }, done => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, progress, reduce]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * 500 }] }));

  return (
    <Modal visible={mounted} transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim }, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.end} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              paddingBottom: insets.bottom + theme.spacing.md,
            },
            theme.shadow.raised,
            panel,
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
          {title ? (
            <View style={{ paddingHorizontal: theme.gutter, paddingBottom: theme.spacing.sm }}>
              <Text variant="h3" accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="small" color="muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ paddingHorizontal: theme.gutter, gap: theme.spacing.lg, paddingBottom: theme.spacing.md }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: theme.gutter, gap: theme.spacing.sm }}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  end: { flex: 1, justifyContent: 'flex-end' },
  panel: { maxHeight: '88%', paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, marginBottom: 12 },
});
