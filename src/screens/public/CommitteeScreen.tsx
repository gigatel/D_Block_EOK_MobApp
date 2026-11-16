import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Home, Phone, Users } from 'lucide-react-native';
import {
  Appear,
  Avatar,
  Badge,
  Card,
  EmptyState,
  Header,
  IconButton,
  Screen,
  Text,
} from '@/components';
import { useBootstrap } from '@/features/data';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTheme } from '@/theme';
import type { CommitteeMember } from '@/types/models';
import { callNumber } from '@/utils/links';
import { QueryBoundary } from './components/QueryBoundary';
import { listScreenContent, useListPadding } from './components/useListPadding';

export function CommitteeScreen() {
  const theme = useTheme();
  const q = useBootstrap();
  const pull = usePullToRefresh(q.isRefetching);
  const pad = useListPadding();
  const members = [...(q.data?.committee ?? [])].sort(
    (a, c) => a.sortOrder - c.sortOrder,
  );
  return (
    <Screen
      scroll={false}
      bleed
      header={<Header title="Managing committee" />}
      contentStyle={listScreenContent}
    >
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {() => (
          <FlatList
            data={members}
            keyExtractor={m => m.id}
            contentContainerStyle={pad}
            refreshControl={
              <RefreshControl
                refreshing={pull.refreshing}
                onRefresh={() => {
                  pull.start();
                  q.refetch();
                }}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            ListHeaderComponent={
              <Text color="muted" style={{ marginBottom: theme.spacing.xs }}>
                Elected by D Block residents at the Annual General Meeting.
                Reach out for anything concerning our neighbourhood.
              </Text>
            }
            ListEmptyComponent={
              <EmptyState icon={Users} title="Committee details coming soon" />
            }
            renderItem={({ item, index }) => (
              <Appear index={index}>
                <MemberCard m={item} lead={index === 0} />
              </Appear>
            )}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

function MemberCard({ m, lead }: { m: CommitteeMember; lead: boolean }) {
  const theme = useTheme();
  return (
    <Card variant={lead ? 'accent' : 'elevated'}>
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <Avatar name={m.name} color={m.avatarColor} size={lead ? 60 : 52} />
        <View style={styles.flex}>
          <Badge label={m.designation} tone={lead ? 'primary' : 'accent'} />
          <Text variant="title" style={styles.name}>
            {m.name}
          </Text>
          {m.houseNo || m.since ? (
            <View style={styles.meta}>
              {m.houseNo ? <Badge label={m.houseNo} icon={Home} /> : null}
              {m.since ? (
                <Text variant="caption" color="muted">
                  Since {m.since}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {m.phone ? (
          <IconButton
            icon={Phone}
            label={`Call ${m.name}`}
            variant="tonal"
            color="primary"
            onPress={() => callNumber(m.phone)}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  name: { marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});
