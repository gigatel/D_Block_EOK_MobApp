import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, FlaskConical } from 'lucide-react-native';
import { env } from '@/config/env';
import { useThemeState } from '@/theme';
import { useThemePreview } from '@/store/themePreview';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Small pill shown in mock mode so nobody mistakes demo data for real data. */
export function DemoBadge() {
  if (env.DATA_MODE === 'api') return null;
  return (
    <View style={styles.demo} accessibilityLabel="Demo data">
      <Icon icon={FlaskConical} size={12} rawColor="#5A4300" />
      <Text variant="caption" style={styles.demoText}>
        Demo data
      </Text>
    </View>
  );
}

/** Global banner while an admin previews/simulates a theme on this device. */
export function PreviewBanner() {
  const { previewing, theme } = useThemeState();
  const backToLive = useThemePreview(s => s.backToLive);
  const insets = useSafeAreaInsets();
  if (!previewing) return null;
  return (
    <View pointerEvents="box-none" style={[styles.previewWrap, { bottom: insets.bottom + 92 }]}>
      <PressableScale
        onPress={backToLive}
        accessibilityLabel={`Previewing ${theme.name}. Only you see this. Tap to go back to live.`}
        style={[styles.preview, { backgroundColor: theme.colors.text }]}>
        <Icon icon={Eye} size={16} rawColor="#FFFFFF" />
        <Text variant="label" style={styles.previewText} numberOfLines={1}>
          Previewing “{theme.name}” — only you see this
        </Text>
        <Text variant="label" style={[styles.previewText, styles.live]}>
          Back to live
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  demo: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFE7A3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  demoText: { color: '#5A4300', fontWeight: '700', fontSize: 11, lineHeight: 14 },
  previewWrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center', zIndex: 900 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, maxWidth: 520 },
  previewText: { color: '#FFFFFF', flexShrink: 1 },
  live: { textDecorationLine: 'underline', flexShrink: 0 },
});
