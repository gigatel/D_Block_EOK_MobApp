import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { CalendarDays, ImagePlus, Images, Loader, Lock, Play, UserRound } from 'lucide-react-native';
import {
  Appear,
  Badge,
  EmptyState,
  Header,
  IconButton,
  Icon,
  PressableScale,
  RemoteImage,
  Screen,
  Text,
} from '@/components';
import { albumMedia, useBootstrap } from '@/features/data';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { RootStackParamList } from '@/navigation/types';
import { useCan } from '@/store/session';
import { useTheme } from '@/theme';
import type { MediaAsset } from '@/types/models';
import { QueryBoundary } from './components/QueryBoundary';
import { useGrid } from './components/useGrid';
import { listScreenContent, useListPadding } from './components/useListPadding';

export function formatDuration(sec?: number | null): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AlbumDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'AlbumDetail'>>();
  const q = useBootstrap();
  const pull = usePullToRefresh(q.isRefetching);
  const canUpload = useCan('media.upload');
  const pad = useListPadding();
  const { columns, itemWidth, gap } = useGrid({
    phone: 3,
    tablet: 4,
    large: 6,
    gap: 4,
  });
  const album = q.data?.albums.find(
    a => a.id === params.albumId || a.slug === params.albumId,
  );
  const items = useMemo(
    () => (q.data && album ? albumMedia(q.data, album.id) : []),
    [q.data, album],
  );
  const event = album?.eventId
    ? q.data?.events.find(e => e.id === album.eventId)
    : undefined;
  const videos = items.filter(i => i.kind === 'video').length;

  return (
    <Screen
      scroll={false}
      bleed
      header={
        <Header
          title={album?.title ?? 'Album'}
          right={
            canUpload && album ? (
              <IconButton
                icon={ImagePlus}
                label="Upload to this album"
                variant="tonal"
                color="primary"
                onPress={() =>
                  navigation.navigate('AlbumUpload', { albumId: album.id })
                }
              />
            ) : undefined
          }
        />
      }
      contentStyle={listScreenContent}
    >
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {() =>
          !album ? (
            <EmptyState
              icon={Lock}
              title="Album not available"
              message="It may be private or removed."
            />
          ) : (
            <FlatList
              key={columns}
              data={items}
              numColumns={columns}
              keyExtractor={m => m.id}
              contentContainerStyle={[pad, { gap }]}
              columnWrapperStyle={{ gap }}
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
                <View
                  style={{
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  <Text color="muted">{album.description}</Text>
                  <View style={styles.badges}>
                    <Badge
                      label={`${items.length - videos} photos`}
                      tone="primary"
                      icon={Images}
                    />
                    {videos ? (
                      <Badge
                        label={`${videos} videos`}
                        tone="accent"
                        icon={Play}
                      />
                    ) : null}
                    <Badge label={String(album.year)} />
                    {album.visibility !== 'Public' ? (
                      <Badge
                        label={`${album.visibility} only`}
                        tone="info"
                        icon={Lock}
                      />
                    ) : null}
                  </View>
                  {event ? (
                    <PressableScale
                      onPress={() =>
                        navigation.navigate('EventDetail', { id: event.id })
                      }
                      style={styles.eventLink}
                      accessibilityLabel={`From event ${event.title}`}
                    >
                      <Icon icon={CalendarDays} size={16} color="primary" />
                      <Text variant="label" color="primary">
                        From: {event.title}
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>
              }
              ListEmptyComponent={
                <EmptyState
                  icon={Images}
                  title="No photos yet"
                  message="The committee will upload photos soon."
                />
              }
              renderItem={({ item, index }) => (
                <Appear index={index}>
                  <MediaTile
                    item={item}
                    size={itemWidth}
                    onPress={() =>
                      navigation.navigate('MediaViewer', {
                        albumId: album.id,
                        index,
                      })
                    }
                  />
                </Appear>
              )}
            />
          )
        }
      </QueryBoundary>
    </Screen>
  );
}

function MediaTile({
  item,
  size,
  onPress,
}: {
  item: MediaAsset;
  size: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const processing = item.status !== 'Ready';
  const by = item.uploadedBy?.trim();
  return (
    <View style={{ width: size }}>
      <PressableScale
        onPress={onPress}
        disabled={processing}
        accessibilityLabel={`${item.kind === 'video' ? 'Video' : 'Photo'}: ${
          item.title
        }${by ? `, uploaded by ${by}` : ''}${processing ? ', processing' : ''}`}
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: theme.radius.sm },
        ]}
      >
        <RemoteImage
          uri={item.posterUrl ?? item.thumbUrl}
          style={StyleSheet.absoluteFill}
        />
        {item.kind === 'video' ? (
          <View style={styles.videoBadge}>
            <Icon icon={Play} size={12} rawColor="#FFFFFF" />
            <Text variant="caption" style={styles.white}>
              {formatDuration(item.durationSec)}
            </Text>
          </View>
        ) : null}
        {processing ? (
          <View style={[StyleSheet.absoluteFill, styles.processing]}>
            <Icon icon={Loader} size={18} rawColor="#FFFFFF" />
            <Text variant="caption" style={styles.white}>
              Processing
            </Text>
          </View>
        ) : null}
      </PressableScale>
      {by ? (
        <View style={styles.byline} importantForAccessibility="no-hide-descendants">
          <Icon icon={UserRound} size={12} color="muted" />
          <Text variant="caption" color="muted" numberOfLines={1} style={styles.flex1}>
            {by}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { overflow: 'hidden' },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  flex1: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  eventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
  },
  videoBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  white: { color: '#FFFFFF' },
  processing: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
