import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useAlertStore, type AlertButton, type AlertTone } from '@/store/alert';
import { useReduceMotion, useTheme, type AppColors } from '@/theme';
import { haptic } from '@/utils/haptics';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

const TONE_ICON: Record<AlertTone, LucideIcon> = {
  primary: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

function toneColors(tone: AlertTone, c: AppColors): { bg: string; fg: string } {
  switch (tone) {
    case 'danger':
      return { bg: c.dangerSoft, fg: c.danger };
    case 'success':
      return { bg: c.successSoft, fg: c.success };
    case 'warning':
      return { bg: c.warningSoft, fg: c.warning };
    case 'info':
      return { bg: c.infoSoft, fg: c.info };
    default:
      return { bg: c.primarySoft, fg: c.primary };
  }
}

const variantFor = (b: AlertButton, isMain: boolean) =>
  b.style === 'destructive' ? 'danger' : b.style === 'cancel' ? 'secondary' : isMain ? 'primary' : 'soft';

/** Global themed alert dialog — render once at the app root; call `showAlert(...)` anywhere. */
export function AlertHost() {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const { width } = useWindowDimensions();
  const current = useAlertStore(s => s.queue[0]);
  const shift = useAlertStore(s => s.shift);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const destructive = current?.buttons.some(b => b.style === 'destructive');
  const tone: AlertTone = current?.options.tone ?? (destructive ? 'danger' : 'primary');
  const colors = toneColors(tone, theme.colors);
  const icon = current?.options.icon ?? TONE_ICON[tone];
  const cancel = current?.buttons.find(b => b.style === 'cancel');
  const dismissable = current?.options.dismissable ?? !!cancel;

  useEffect(() => {
    if (current) haptic(destructive ? 'warning' : 'selection');
  }, [current, destructive]);

  if (!current) return null;

  const press = async (b: AlertButton, i: number) => {
    if (busyIndex !== null) return;
    setBusyIndex(i);
    try {
      await b.onPress?.();
    } finally {
      setBusyIndex(null);
      shift();
    }
  };
  const dismiss = () => {
    if (!dismissable) return;
    if (cancel) press(cancel, current.buttons.indexOf(cancel));
    else shift();
  };

  // Cancel first (left/top), main action last — like the platform dialogs.
  const ordered = [...current.buttons].sort((a, b) => (a.style === 'cancel' ? -1 : b.style === 'cancel' ? 1 : 0));
  const mainIndex = ordered.length - 1;
  const row = ordered.length === 2 && ordered.every(b => b.text.length <= 16);

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={dismiss}>
      <Animated.View
        entering={reduce ? undefined : FadeIn.duration(180)}
        exiting={reduce ? undefined : FadeOut.duration(150)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Close dialog" accessible={dismissable} />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          key={current.id}
          entering={reduce ? undefined : ZoomIn.springify().damping(18).stiffness(220)}
          exiting={reduce ? undefined : ZoomOut.duration(140)}
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.card,
            {
              width: Math.min(width - 48, 380),
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg + 6,
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
              borderColor: theme.colors.border,
            },
            theme.shadow.raised,
          ]}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <View style={[styles.badgeInner, { borderColor: colors.fg }]}>
              <Icon icon={icon} size={28} rawColor={colors.fg} />
            </View>
          </View>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="h3" align="center">
              {current.title}
            </Text>
            {current.message ? (
              <Text color="muted" align="center">
                {current.message}
              </Text>
            ) : null}
          </View>
          <View style={[row ? styles.row : styles.column, { gap: theme.spacing.sm, marginTop: theme.spacing.xs }]}>
            {ordered.map((b, i) => (
              <View key={`${b.text}-${i}`} style={row ? styles.flex : undefined}>
                <Button
                  title={b.text}
                  icon={b.icon}
                  variant={variantFor(b, i === mainIndex)}
                  loading={busyIndex === current.buttons.indexOf(b)}
                  disabled={busyIndex !== null && busyIndex !== current.buttons.indexOf(b)}
                  onPress={() => press(b, current.buttons.indexOf(b))}
                />
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(12, 8, 6, 0.55)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { alignItems: 'stretch', borderWidth: StyleSheet.hairlineWidth },
  badge: { alignSelf: 'center', width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  badgeInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed' },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  flex: { flex: 1 },
});
