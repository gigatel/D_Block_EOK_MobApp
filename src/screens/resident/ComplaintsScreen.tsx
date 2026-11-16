import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ClipboardCheck, Plus } from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  Header,
  Icon,
  PRIORITY_TONE,
  Screen,
  STATUS_TONE,
  Text,
} from '@/components';
import { complaintCounts, useBootstrap } from '@/features/data';
import { useCan } from '@/store/session';
import { useTheme } from '@/theme';
import { COMPLAINT_STATUSES, type ComplaintStatus } from '@/types/models';
import { timeAgo } from '@/utils/date';
import { GatedScreen } from './components/GatedScreen';
import { COMPLAINT_ICON } from './components/icons';
import { QueryState } from './components/QueryState';

type Filter = 'All' | ComplaintStatus;
const FILTERS: readonly Filter[] = ['All', ...COMPLAINT_STATUSES];

function ComplaintsContent() {
  const theme = useTheme();
  const navigation = useNavigation();
  const manage = useCan('complaints.manage');
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const [filter, setFilter] = useState<Filter>('All');

  const counts = useMemo(() => {
    const c = data
      ? complaintCounts(data)
      : { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
    return { All: data?.complaints.length ?? 0, ...c };
  }, [data]);

  const rows = useMemo(
    () =>
      (data?.complaints ?? [])
        .filter(c => filter === 'All' || c.status === filter)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [data, filter],
  );

  return (
    <Screen
      header={<Header title={manage ? 'All complaints' : 'My complaints'} />}
      onRefresh={refetch}
      refreshing={isRefetching}
      footer={
        <Button
          title="New complaint"
          icon={Plus}
          onPress={() => navigation.navigate('NewComplaint')}
          size="lg"
        />
      }
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <ChipGroup
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={
              filter === 'All'
                ? 'No complaints yet'
                : `Nothing ${filter.toLowerCase()}`
            }
            message="Spotted a broken light, garbage pile-up or parking trouble? Let the committee know."
          />
        ) : (
          rows.map((c, i) => (
            <Appear key={c.id} index={i}>
              <Card
                onPress={() =>
                  navigation.navigate('ComplaintDetail', { id: c.id })
                }
                accessibilityLabel={`${c.subject}. ${c.status}. Ticket ${c.ticketNo}`}
                style={{ gap: theme.spacing.sm }}
              >
                <View style={styles.top}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: theme.colors.primarySoft,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <Icon
                      icon={COMPLAINT_ICON[c.category]}
                      size={20}
                      color="primary"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="caption" color="muted">
                      {c.ticketNo} · {c.category}
                    </Text>
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {c.subject}
                    </Text>
                  </View>
                </View>
                <View style={styles.meta}>
                  <Badge label={c.status} tone={STATUS_TONE[c.status]} />
                  <Badge label={c.priority} tone={PRIORITY_TONE[c.priority]} />
                  <Text variant="caption" color="muted" style={styles.time}>
                    Updated {timeAgo(c.updatedAt)}
                  </Text>
                </View>
              </Card>
            </Appear>
          ))
        )}
      </QueryState>
    </Screen>
  );
}

export function ComplaintsScreen() {
  return (
    <GatedScreen
      title="Complaints"
      message="Sign in to raise complaints and track their status."
    >
      <ComplaintsContent />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  time: { marginLeft: 'auto' },
});
