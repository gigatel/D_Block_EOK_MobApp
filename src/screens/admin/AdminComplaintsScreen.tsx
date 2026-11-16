import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowDownWideNarrow,
  Clock,
  Inbox,
  UserRound,
  Wrench,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  Icon,
  PRIORITY_TONE,
  SegmentedControl,
  SkeletonList,
  STATUS_TONE,
  Text,
} from '@/components';
import {
  complaintCounts,
  flatOf,
  residentName,
  useBootstrap,
} from '@/features/data';
import {
  COMPLAINT_STATUSES,
  PRIORITIES,
  type Complaint,
  type ComplaintStatus,
} from '@/types/models';
import { timeAgo } from '@/utils/date';
import { AdminScreen } from './components';

type Filter = 'All' | ComplaintStatus;
type Sort = 'priority' | 'newest';
const FILTERS: readonly Filter[] = ['All', ...COMPLAINT_STATUSES];
const PRIORITY_RANK = Object.fromEntries(
  PRIORITIES.map((p, i) => [p, PRIORITIES.length - i]),
) as Record<Complaint['priority'], number>;

export function AdminComplaintsScreen() {
  const navigation = useNavigation();
  const { data, isLoading, error, refetch } = useBootstrap();
  const [filter, setFilter] = useState<Filter>('Open');
  const [sort, setSort] = useState<Sort>('priority');

  const counts = useMemo(() => {
    if (!data) return {};
    const c = complaintCounts(data);
    return { All: data.complaints.length, ...c } as Partial<
      Record<Filter, number>
    >;
  }, [data]);

  const list = useMemo(() => {
    if (!data) return [];
    const rows =
      filter === 'All'
        ? [...data.complaints]
        : data.complaints.filter(c => c.status === filter);
    return rows.sort((a, b) =>
      sort === 'priority'
        ? PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
          Date.parse(a.createdAt) - Date.parse(b.createdAt)
        : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }, [data, filter, sort]);

  return (
    <AdminScreen title="Complaints" permission="complaints.manage">
      <ChipGroup
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        counts={counts}
      />
      <SegmentedControl
        options={['priority', 'newest'] as const}
        value={sort}
        onChange={setSort}
        labels={{ priority: 'Priority first', newest: 'Newest first' }}
      />
      {isLoading ? (
        <SkeletonList />
      ) : error || !data ? (
        <ErrorState
          message={error?.message ?? 'Could not load complaints.'}
          onRetry={() => refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`No ${
            filter === 'All' ? '' : filter.toLowerCase() + ' '
          }complaints`}
          message="Nice — nothing waiting here."
        />
      ) : (
        list.map((c, i) => {
          const resident = data.residents.find(r => r.id === c.residentId);
          const flat = flatOf(data, c.residentId);
          return (
            <Appear key={c.id} index={i}>
              <Card
                onPress={() =>
                  navigation.navigate('ComplaintDetail', { id: c.id })
                }
                accessibilityLabel={`${c.ticketNo}, ${c.subject}, ${c.priority} priority, ${c.status}`}
              >
                <View style={styles.rowBetween}>
                  <Text variant="overline" color="muted">
                    {c.ticketNo}
                  </Text>
                  <Badge label={c.status} tone={STATUS_TONE[c.status]} />
                </View>
                <Text
                  variant="title"
                  numberOfLines={2}
                  style={styles.marginTop4}
                >
                  {c.subject}
                </Text>
                <View style={styles.badges}>
                  <Badge
                    label={c.priority}
                    tone={PRIORITY_TONE[c.priority]}
                    icon={ArrowDownWideNarrow}
                  />
                  <Badge label={c.category} tone="primary" />
                </View>
                <View style={styles.meta}>
                  <View style={styles.metaItem}>
                    <Icon icon={UserRound} size={14} color="muted" />
                    <Text variant="caption" color="muted">
                      {residentName(resident)}
                      {flat ? ` · ${flat.houseNo}` : ''}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon icon={Clock} size={14} color="muted" />
                    <Text variant="caption" color="muted">
                      {timeAgo(c.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon
                      icon={Wrench}
                      size={14}
                      color={c.assignedTo ? 'muted' : 'warning'}
                    />
                    <Text
                      variant="caption"
                      color={c.assignedTo ? 'muted' : 'warning'}
                    >
                      {c.assignedTo ?? 'Unassigned'}
                    </Text>
                  </View>
                </View>
              </Card>
            </Appear>
          );
        })
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  marginTop4: { marginTop: 4 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
