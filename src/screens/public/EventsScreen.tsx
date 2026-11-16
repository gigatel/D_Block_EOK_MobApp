import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CalendarDays } from 'lucide-react-native';
import {
  Appear,
  ChipGroup,
  EmptyState,
  Header,
  Screen,
  SegmentedControl,
} from '@/components';
import {
  myRegistration,
  pastEvents,
  rsvpSummary,
  upcomingEvents,
  useBootstrap,
} from '@/features/data';
import { useTheme } from '@/theme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { EVENT_CATEGORIES, type EventCategory } from '@/types/models';
import { EventCard } from './components/EventCard';
import { QueryBoundary } from './components/QueryBoundary';
import { listScreenContent, useListPadding } from './components/useListPadding';

type When = 'upcoming' | 'past';
const FILTERS = ['All', ...EVENT_CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

export function EventsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const q = useBootstrap();
  const pull = usePullToRefresh(q.isRefetching);
  const pad = useListPadding();
  const [when, setWhen] = useState<When>('upcoming');
  const [filter, setFilter] = useState<Filter>('All');

  const list = useMemo(() => {
    if (!q.data) return [];
    const base =
      when === 'upcoming' ? upcomingEvents(q.data) : pastEvents(q.data);
    return filter === 'All'
      ? base
      : base.filter(e => e.category === (filter as EventCategory));
  }, [q.data, when, filter]);

  const counts = useMemo(() => {
    const base = q.data
      ? when === 'upcoming'
        ? upcomingEvents(q.data)
        : pastEvents(q.data)
      : [];
    const out: Partial<Record<Filter, number>> = { All: base.length };
    for (const e of base) out[e.category] = (out[e.category] ?? 0) + 1;
    return out;
  }, [q.data, when]);

  return (
    <Screen
      scroll={false}
      bleed
      header={
        <Header
          title="Events"
          subtitle="Festivals, meetings & community life"
          large
          back={false}
        />
      }
      contentStyle={listScreenContent}
    >
      <View
        style={{
          paddingHorizontal: theme.gutter,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <SegmentedControl
          options={['upcoming', 'past'] as const}
          labels={{ upcoming: 'Upcoming', past: 'Past' }}
          value={when}
          onChange={setWhen}
        />
        <ChipGroup
          options={FILTERS.filter(f => f === 'All' || counts[f])}
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
      </View>
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {b => (
          <FlatList
            data={list}
            keyExtractor={e => e.id}
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
            ListEmptyComponent={
              <EmptyState
                icon={CalendarDays}
                title={
                  when === 'upcoming'
                    ? 'Nothing scheduled yet'
                    : 'No past events'
                }
                message={
                  filter === 'All'
                    ? 'Check back soon — the committee posts events here.'
                    : `No ${filter.toLowerCase()} events.`
                }
              />
            }
            renderItem={({ item, index }) => (
              <Appear index={index}>
                <EventCard
                  event={item}
                  past={when === 'past'}
                  going={rsvpSummary(b, item.id).goingFamilies}
                  myStatus={myRegistration(b, item.id)?.status}
                  onPress={() =>
                    navigation.navigate('EventDetail', { id: item.id })
                  }
                />
              </Appear>
            )}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}
