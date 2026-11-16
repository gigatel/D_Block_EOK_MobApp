import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { BellOff, CheckCheck } from 'lucide-react-native';
import {
  Appear,
  Card,
  EmptyState,
  Header,
  Icon,
  IconButton,
  Screen,
  Text,
} from '@/components';
import { unreadCount, useBootstrap, useSave } from '@/features/data';
import { openLink } from '@/navigation/links';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme';
import type { AppNotification } from '@/types/models';
import { isSameIstDay, timeAgo } from '@/utils/date';
import { GatedScreen } from './components/GatedScreen';
import { NOTIFICATION_ICON } from './components/icons';
import { QueryState } from './components/QueryState';

function NotificationsContent() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const save = useSave();

  const groups = useMemo(() => {
    const rows = [...(data?.notifications ?? [])].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    const now = Date.now();
    return [
      {
        title: 'Today',
        rows: rows.filter(n => isSameIstDay(n.createdAt, now)),
      },
      {
        title: 'Earlier',
        rows: rows.filter(n => !isSameIstDay(n.createdAt, now)),
      },
    ].filter(g => g.rows.length);
  }, [data]);
  const unread = data ? unreadCount(data) : 0;

  const markRead = (n: AppNotification) =>
    save
      .mutateAsync({
        collection: 'notifications',
        id: n.id,
        body: { ...n, read: true },
      })
      .catch(() => undefined);

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n);
    openLink(navigation, n.link);
  };

  const markAll = async () => {
    const pending = (data?.notifications ?? []).filter(n => !n.read);
    for (const n of pending) {
      await markRead(n);
    }
  };

  let index = 0;
  return (
    <Screen
      header={
        <Header
          title="Notifications"
          right={
            unread ? (
              <IconButton
                icon={CheckCheck}
                label="Mark all as read"
                onPress={markAll}
                color="primary"
              />
            ) : undefined
          }
        />
      }
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {groups.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications"
            message="Updates about notices, events, complaints and polls will appear here."
          />
        ) : (
          groups.map(g => (
            <View key={g.title} style={{ gap: theme.spacing.sm }}>
              <Text variant="overline" color="muted" accessibilityRole="header">
                {g.title}
              </Text>
              {g.rows.map(n => (
                <Appear key={n.id} index={index++}>
                  <Card
                    padding="sm"
                    variant={n.read ? 'outlined' : 'elevated'}
                    onPress={() => open(n)}
                    accessibilityLabel={`${n.read ? '' : 'Unread. '}${
                      n.title
                    }. ${n.message}. ${timeAgo(n.createdAt)}`}
                    style={styles.row}
                  >
                    <View
                      style={[
                        styles.icon,
                        {
                          backgroundColor: n.read
                            ? theme.colors.surfaceAlt
                            : theme.colors.primarySoft,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <Icon
                        icon={
                          NOTIFICATION_ICON[n.category] ??
                          NOTIFICATION_ICON.general
                        }
                        size={20}
                        color={n.read ? 'muted' : 'primary'}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text
                        variant={n.read ? 'body' : 'bodyStrong'}
                        numberOfLines={2}
                      >
                        {n.title}
                      </Text>
                      <Text variant="small" color="muted" numberOfLines={2}>
                        {n.message}
                      </Text>
                      <Text variant="caption" color="muted">
                        {timeAgo(n.createdAt)}
                      </Text>
                    </View>
                    {!n.read ? (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: theme.colors.accent },
                        ]}
                      />
                    ) : null}
                  </Card>
                </Appear>
              ))}
            </View>
          ))
        )}
      </QueryState>
    </Screen>
  );
}

export function NotificationsScreen() {
  return (
    <GatedScreen
      title="Notifications"
      message="Sign in to see your notifications."
    >
      <NotificationsContent />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
