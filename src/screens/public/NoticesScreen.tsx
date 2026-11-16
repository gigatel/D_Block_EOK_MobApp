import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Megaphone, Search, X } from 'lucide-react-native';
import {
  Appear,
  ChipGroup,
  EmptyState,
  Header,
  IconButton,
  Input,
  Screen,
} from '@/components';
import { activeAnnouncements, useBootstrap } from '@/features/data';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useDebounce } from '@/hooks/useDebounce';
import { useTheme } from '@/theme';
import {
  ANNOUNCEMENT_CATEGORIES,
  type AnnouncementCategory,
} from '@/types/models';
import { AnnouncementCard } from './components/AnnouncementCard';
import { QueryBoundary } from './components/QueryBoundary';
import { listScreenContent, useListPadding } from './components/useListPadding';

const FILTERS = ['All', ...ANNOUNCEMENT_CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

export function NoticesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const q = useBootstrap();
  const pull = usePullToRefresh(q.isRefetching);
  const pad = useListPadding();
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const term = useDebounce(query.trim().toLowerCase(), 200);

  const all = useMemo(
    () => (q.data ? activeAnnouncements(q.data) : []),
    [q.data],
  );
  const counts = useMemo(() => {
    const out: Partial<Record<Filter, number>> = { All: all.length };
    for (const a of all) out[a.category] = (out[a.category] ?? 0) + 1;
    return out;
  }, [all]);
  const list = useMemo(
    () =>
      all.filter(
        a =>
          (filter === 'All' ||
            a.category === (filter as AnnouncementCategory)) &&
          (!term ||
            a.title.toLowerCase().includes(term) ||
            a.body.toLowerCase().includes(term)),
      ),
    [all, filter, term],
  );

  return (
    <Screen
      scroll={false}
      bleed
      header={
        <Header
          title="Notice board"
          subtitle="Circulars, maintenance & security updates"
          large
          back={false}
        />
      }
      contentStyle={listScreenContent}
    >
      <View
        style={{
          paddingHorizontal: theme.gutter,
          gap: theme.spacing.sm,
          paddingBottom: theme.spacing.xs,
        }}
      >
        <Input
          label="Search notices"
          placeholder="e.g. water, parking, Diwali"
          icon={Search}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          right={
            query ? (
              <IconButton
                icon={X}
                label="Clear search"
                size={18}
                color="muted"
                onPress={() => setQuery('')}
              />
            ) : undefined
          }
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
        {() => (
          <FlatList
            data={list}
            keyExtractor={a => a.id}
            contentContainerStyle={pad}
            keyboardShouldPersistTaps="handled"
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
                icon={Megaphone}
                title={term ? 'No matching notices' : 'No notices'}
                message={
                  term
                    ? 'Try a different word.'
                    : 'Announcements from the committee will appear here.'
                }
              />
            }
            renderItem={({ item, index }) => (
              <Appear index={index}>
                <AnnouncementCard
                  item={item}
                  onPress={() =>
                    navigation.navigate('AnnouncementDetail', { id: item.id })
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
