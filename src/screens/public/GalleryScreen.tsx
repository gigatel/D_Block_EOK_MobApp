import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ImagePlus, Images, LogIn } from 'lucide-react-native';
import {
  Appear,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  Header,
  IconButton,
  Screen,
  Text,
} from '@/components';
import { albumCover, albumMedia, useBootstrap } from '@/features/data';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useCan, useIsSignedIn } from '@/store/session';
import { useTheme } from '@/theme';
import { AlbumCard } from './components/AlbumCard';
import { QueryBoundary } from './components/QueryBoundary';
import { useGrid } from './components/useGrid';
import { listScreenContent, useListPadding } from './components/useListPadding';

export function GalleryScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const signedIn = useIsSignedIn();
  // Only accounts granted media.upload at sign-in (mobile + OTP) see the upload entry.
  const canUpload = useCan('media.upload');
  const q = useBootstrap();
  const pull = usePullToRefresh(q.isRefetching);
  const pad = useListPadding();
  const { columns, itemWidth, gap } = useGrid();
  const [year, setYear] = useState('All');

  const years = useMemo(
    () => [
      'All',
      ...Array.from(new Set((q.data?.albums ?? []).map(a => String(a.year))))
        .sort()
        .reverse(),
    ],
    [q.data],
  );
  const albums = useMemo(
    () =>
      (q.data?.albums ?? [])
        .filter(a => year === 'All' || String(a.year) === year)
        .sort((a, c) => c.year - a.year),
    [q.data, year],
  );

  return (
    <Screen
      scroll={false}
      bleed
      header={
        <Header
          title="Gallery"
          subtitle="Moments from our community"
          large
          back={false}
          right={
            canUpload ? (
              <IconButton
                icon={ImagePlus}
                label="Upload photos or videos"
                variant="tonal"
                color="primary"
                onPress={() => navigation.navigate('AlbumUpload')}
              />
            ) : undefined
          }
        />
      }
      contentStyle={listScreenContent}
    >
      {years.length > 2 ? (
        <View
          style={{
            paddingHorizontal: theme.gutter,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <ChipGroup options={years} value={year} onChange={setYear} />
        </View>
      ) : null}
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {b => (
          <FlatList
            key={columns}
            data={albums}
            numColumns={columns}
            keyExtractor={a => a.id}
            contentContainerStyle={pad}
            columnWrapperStyle={columns > 1 ? { gap } : undefined}
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
                icon={Images}
                title="No albums yet"
                message="Photos from events will appear here."
              />
            }
            ListFooterComponent={
              !signedIn ? (
                <Card
                  variant="tinted"
                  style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}
                >
                  <Text variant="title">More albums for residents</Text>
                  <Text variant="small" color="muted">
                    Sign in to see residents-only albums like Holi celebrations
                    and society meetings.
                  </Text>
                  <Button
                    title="Resident sign in"
                    icon={LogIn}
                    variant="soft"
                    onPress={() => navigation.navigate('Login')}
                  />
                </Card>
              ) : undefined
            }
            renderItem={({ item, index }) => (
              <Appear index={index} style={{ width: itemWidth }}>
                <AlbumCard
                  album={item}
                  cover={albumCover(b, item)}
                  count={albumMedia(b, item.id).length}
                  onPress={() =>
                    navigation.navigate('AlbumDetail', { albumId: item.id })
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
