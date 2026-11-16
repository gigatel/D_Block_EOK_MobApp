import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { IconButton, Text } from '@/components';
import { useTheme } from '@/theme';

/** Accessible −/+ counter. */
export function Stepper({
  label,
  hint,
  value,
  min = 0,
  max = 10,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.row, { minHeight: theme.touchTarget + 8 }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'increment')
          onChange(Math.min(max, value + 1));
        if (e.nativeEvent.actionName === 'decrement')
          onChange(Math.max(min, value - 1));
      }}
    >
      <View style={styles.flex}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text variant="caption" color="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.controls,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <IconButton
          icon={Minus}
          label={`Fewer ${label.toLowerCase()}`}
          onPress={() => onChange(Math.max(min, value - 1))}
          color={value <= min ? 'muted' : 'primary'}
          size={18}
        />
        <Text variant="h3" style={styles.value}>
          {value}
        </Text>
        <IconButton
          icon={Plus}
          label={`More ${label.toLowerCase()}`}
          onPress={() => onChange(Math.min(max, value + 1))}
          color={value >= max ? 'muted' : 'primary'}
          size={18}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  value: { minWidth: 28, textAlign: 'center' },
});
