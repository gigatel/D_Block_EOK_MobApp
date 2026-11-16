import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarPlus,
  Globe,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  DateBadge,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  SegmentedControl,
  SkeletonList,
  Text,
} from '@/components';
import {
  pastEvents,
  rsvpSummary,
  upcomingEvents,
  useBootstrap,
  useRemove,
} from '@/features/data';
import type { RwaEvent } from '@/types/models';
import { formatDateTime, formatTime } from '@/utils/date';
import { AdminScreen, ConfirmSheet } from './components';

type Tab = 'upcoming' | 'past';

export function AdminEventsScreen() {
  const navigation = useNavigation();
  const { data, isLoading, error, refetch } = useBootstrap();
  const remove = useRemove();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [toDelete, setToDelete] = useState<RwaEvent | null>(null);
  const list = useMemo(
    () =>
      data
        ? tab === 'upcoming'
          ? upcomingEvents(data)
          : pastEvents(data)
        : [],
    [data, tab],
  );

  return (
    <AdminScreen
      title="Events"
      permission="events.manage"
      right={
        <IconButton
          icon={Plus}
          label="New event"
          variant="tonal"
          color="primary"
          onPress={() => navigation.navigate('EventEditor', {})}
        />
      }
    >
      <SegmentedControl
        options={['upcoming', 'past'] as const}
        value={tab}
        onChange={setTab}
        labels={{ upcoming: 'Upcoming', past: 'Past' }}
      />
      {isLoading ? (
        <SkeletonList />
      ) : error || !data ? (
        <ErrorState
          message={error?.message ?? 'Could not load events.'}
          onRetry={() => refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title={tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          actionLabel="Create event"
          onAction={() => navigation.navigate('EventEditor', {})}
        />
      ) : (
        list.map((e, i) => {
          const r = rsvpSummary(data, e.id);
          return (
            <Appear key={e.id} index={i}>
              <Card
                onPress={() => navigation.navigate('EventDetail', { id: e.id })}
                accessibilityLabel={`${e.title}, ${formatDateTime(e.startsAt)}`}
              >
                <View style={styles.row}>
                  <DateBadge
                    date={e.startsAt}
                    variant={tab === 'upcoming' ? 'solid' : 'light'}
                  />
                  <View style={styles.flex}>
                    <Text variant="title" numberOfLines={2}>
                      {e.title}
                    </Text>
                    <Text variant="small" color="muted" numberOfLines={1}>
                      {formatTime(e.startsAt)} – {formatTime(e.endsAt)} ·{' '}
                      {e.venue}
                    </Text>
                    <View style={styles.badges}>
                      <Badge label={e.category} tone="primary" />
                      <Badge
                        label={e.isPublic ? 'Public' : 'Residents'}
                        tone={e.isPublic ? 'success' : 'info'}
                        icon={e.isPublic ? Globe : Lock}
                      />
                      <Badge
                        label={e.registrationOpen ? 'RSVP open' : 'RSVP closed'}
                        tone={e.registrationOpen ? 'accent' : 'neutral'}
                      />
                    </View>
                    <View style={styles.rsvp}>
                      <Icon icon={Users} size={14} color="muted" />
                      <Text variant="caption" color="muted">
                        {r.goingFamilies} families · {r.people} people
                        {r.capacity ? ` of ${r.capacity}` : ''}
                        {r.maybeFamilies ? ` · ${r.maybeFamilies} maybe` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Button
                    title="Edit"
                    icon={Pencil}
                    size="sm"
                    variant="soft"
                    fullWidth={false}
                    onPress={() =>
                      navigation.navigate('EventEditor', { id: e.id })
                    }
                  />
                  <Button
                    title="Delete"
                    icon={Trash2}
                    size="sm"
                    variant="ghost"
                    fullWidth={false}
                    onPress={() => setToDelete(e)}
                  />
                </View>
              </Card>
            </Appear>
          );
        })
      )}
      <Button
        title="Create event"
        icon={CalendarPlus}
        onPress={() => navigation.navigate('EventEditor', {})}
      />
      <ConfirmSheet
        visible={!!toDelete}
        title="Delete event?"
        message={`“${
          toDelete?.title ?? ''
        }” and its RSVPs will be hidden from residents.`}
        loading={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove
            .mutateAsync({
              collection: 'events',
              id: toDelete.id,
              successMessage: 'Event deleted',
            })
            .catch(() => undefined);
          setToDelete(null);
        }}
      />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  rsvp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
