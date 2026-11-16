import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CloudOff, Inbox, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export function EmptyState({ icon = Inbox, title, message, actionLabel, onAction }: { icon?: LucideIcon; title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { gap: theme.spacing.md, padding: theme.spacing.xxl }]}>
      <View style={[styles.circle, { backgroundColor: theme.colors.primarySoft }]}>
        <Icon icon={icon} size={30} color="primary" />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {message ? (
        <Text color="muted" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} fullWidth={false} variant="soft" /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState icon={CloudOff} title="Couldn’t load this" message={message} actionLabel={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
