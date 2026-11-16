import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type InputProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: LucideIcon;
  /** Leading content after the icon, e.g. a "+91" prefix. */
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Character counter when maxLength is set. */
  counter?: boolean;
};

export function Input({
  label,
  error,
  hint,
  icon,
  left,
  right,
  counter,
  style,
  onFocus,
  onBlur,
  multiline,
  value,
  maxLength,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const c = theme.colors;
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color="text">
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            minHeight: multiline ? 110 : theme.touchTarget + 4,
            borderRadius: theme.radius.md,
            backgroundColor: c.surface,
            borderColor: error ? c.danger : focused ? c.primary : c.border,
            borderWidth: focused || error ? 1.6 : 1,
            paddingHorizontal: theme.spacing.md,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {icon ? (
          <View style={multiline ? styles.iconTop : null}>
            <Icon icon={icon} size={19} color={focused ? 'primary' : 'muted'} />
          </View>
        ) : null}
        {left}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={c.muted}
          selectionColor={c.primary}
          multiline={multiline}
          value={value}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            theme.type.body,
            styles.input,
            { color: c.text, paddingVertical: multiline ? 12 : 8 },
            style,
          ]}
          {...rest}
        />
        {right}
      </View>
      <View style={styles.meta}>
        {error ? (
          <Text
            variant="caption"
            color="danger"
            style={styles.flex}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : hint ? (
          <Text variant="caption" color="muted" style={styles.flex}>
            {hint}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {counter && maxLength ? (
          <Text variant="caption" color="muted">
            {(value ?? '').length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, minHeight: 40 },
  iconTop: { paddingTop: 13 },
  meta: { flexDirection: 'row', gap: 8, minHeight: 2 },
  flex: { flex: 1 },
});
