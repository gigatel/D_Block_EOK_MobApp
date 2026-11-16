import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  /** Show back (default when the stack can go back). */
  back?: boolean;
  /** Use a close (X) icon instead — for modals. */
  close?: boolean;
  right?: React.ReactNode;
  /** Large title style for top-level tab screens. */
  large?: boolean;
  transparent?: boolean;
};

export function Header({ title, subtitle, back, close, right, large, transparent }: HeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const showBack = back ?? (close || navigation.canGoBack());
  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingBottom: large ? theme.spacing.sm : theme.spacing.xs,
          backgroundColor: transparent ? 'transparent' : theme.colors.background,
        },
      ]}>
      <View style={[styles.row, { minHeight: theme.touchTarget }]}>
        {showBack ? (
          <IconButton icon={close ? X : ArrowLeft} label={close ? 'Close' : 'Go back'} onPress={() => navigation.goBack()} />
        ) : (
          <View style={{ width: theme.spacing.sm }} />
        )}
        <View style={styles.titles}>
          {!large ? (
            <Text variant="title" numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
      {large ? (
        <View style={{ paddingHorizontal: theme.spacing.sm }}>
          <Text variant="h1" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text color="muted" variant="small">
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, paddingHorizontal: 4 },
  right: { flexDirection: 'row', alignItems: 'center' },
});
