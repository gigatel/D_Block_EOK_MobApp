import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, CircleCheck, Info } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useToast } from '@/store/toast';
import { Icon } from './Icon';
import { Text } from './Text';

/** Global toast host — render once at the app root. Use `toast('Saved')` anywhere. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { current, hide } = useToast();
  useEffect(() => {
    if (!current) return;
    const id = setTimeout(hide, current.kind === 'error' ? 4200 : 2600);
    return () => clearTimeout(id);
  }, [current, hide]);
  if (!current) return null;
  const tone =
    current.kind === 'error'
      ? { bg: theme.colors.danger, icon: CircleAlert }
      : current.kind === 'info'
      ? { bg: theme.colors.text, icon: Info }
      : { bg: theme.colors.primary, icon: CircleCheck };
  return (
    <Animated.View
      key={current.id}
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOutUp.duration(180)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { top: insets.top + 8, backgroundColor: tone.bg, borderRadius: theme.radius.md }, theme.shadow.raised]}>
      <Icon icon={tone.icon} size={20} rawColor="#FFFFFF" />
      <Text variant="bodyStrong" style={styles.text} onPress={hide}>
        {current.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, zIndex: 1000 },
  text: { color: '#FFFFFF', flex: 1 },
});
