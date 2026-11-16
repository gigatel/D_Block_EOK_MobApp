import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag, ImageOff, Play, X } from 'lucide-react-native';
import { Icon, IconButton, Text } from '@/components';
import { albumMedia, useBootstrap } from '@/features/data';
import { useLightStatusBar } from '@/hooks/useStatusBar';
import type { RootStackParamList } from '@/navigation/types';
import { useReduceMotion, useTheme } from '@/theme';
import type { MediaAsset } from '@/types/models';
import { formatBytes } from '@/features/admin/helpers';
import { reportMediaMailto } from '@/features/media/report';
import { toast } from '@/store/toast';
import { formatDate } from '@/utils/date';
import { formatDuration } from './AlbumDetailScreen';

/** Full-screen swipeable photo/video viewer. */
export function MediaViewerScreen() {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { params } = useRoute<RouteProp<RootStackParamList, 'MediaViewer'>>();
  const q = useBootstrap();
  useLightStatusBar();

  const items = useMemo(
    () => (q.data ? albumMedia(q.data, params.albumId) : []),
    [q.data, params.albumId],
  );
  const album = q.data?.albums.find(a => a.id === params.albumId);
  const [index, setIndex] = useState(
    Math.min(params.index, Math.max(0, items.length - 1)),
  );
  const [chrome, setChrome] = useState(true);
  const listRef = useRef<FlatList<MediaAsset>>(null);

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: reduce
      ? chrome
        ? 1
        : 0
      : withTiming(chrome ? 1 : 0, { duration: 200 }),
  }));

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  const current = items[index];
  const officeEmail = q.data?.settings.email;

  const report = useCallback(() => {
    if (!current || !officeEmail) return;
    const what = current.kind === 'video' ? 'video' : 'photo';
    Alert.alert(
      `Report this ${what}?`,
      `Tell the RWA committee if this ${what} is inappropriate. Your email app will open with the details filled in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () =>
            Linking.openURL(
              reportMediaMailto(officeEmail, current, album?.title),
            ).catch(() =>
              toast(`Email ${officeEmail} to report this ${what}.`, 'error'),
            ),
        },
      ],
    );
  }, [current, officeEmail, album?.title]);

  return (
    <View style={styles.root}>
      {items.length ? (
        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(params.index, items.length - 1)}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          keyExtractor={m => m.id}
          onMomentumScrollEnd={onScrollEnd}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setChrome(c => !c)}
              style={{ width, height }}
              accessibilityRole="image"
              accessibilityLabel={item.title}
              accessibilityHint="Tap to show or hide controls"
            >
              <Slide item={item} width={width} height={height} />
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.white}>
            {q.isLoading ? 'Loading…' : 'Nothing to show'}
          </Text>
        </View>
      )}

      <Animated.View
        pointerEvents={chrome ? 'box-none' : 'none'}
        style={[
          styles.topBar,
          { paddingTop: insets.top + 4, paddingHorizontal: theme.spacing.sm },
          chromeStyle,
        ]}
      >
        <IconButton
          icon={X}
          label="Close viewer"
          variant="glass"
          color="onPrimary"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.titleWrap}>
          <Text variant="label" style={styles.white} numberOfLines={1}>
            {album?.title ?? ''}
          </Text>
          {items.length ? (
            <Text
              variant="caption"
              style={styles.whiteSoft}
              accessibilityLabel={`Item ${index + 1} of ${items.length}`}
            >
              {index + 1} / {items.length}
            </Text>
          ) : null}
        </View>
        {current && officeEmail ? (
          <IconButton
            icon={Flag}
            label={`Report this ${current.kind === 'video' ? 'video' : 'photo'}`}
            variant="glass"
            color="onPrimary"
            onPress={report}
          />
        ) : (
          <View style={{ width: theme.touchTarget }} />
        )}
      </Animated.View>

      {current ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.caption,
            {
              paddingBottom: insets.bottom + theme.spacing.lg,
              paddingHorizontal: theme.gutter,
            },
            chromeStyle,
          ]}
        >
          <Text variant="bodyStrong" style={styles.white} numberOfLines={2}>
            {current.title}
          </Text>
          <Text variant="caption" style={styles.whiteSoft}>
            {[
              current.uploadedBy ? `Uploaded by ${current.uploadedBy}` : null,
              formatDate(current.uploadedAt),
              current.width && current.height
                ? `${current.width}×${current.height}`
                : null,
              current.sizeBytes ? formatBytes(current.sizeBytes) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Slide({
  item,
  width,
  height,
}: {
  item: MediaAsset;
  width: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={styles.center}>
        <Icon icon={ImageOff} rawColor="#FFFFFF" size={32} />
      </View>
    );
  }
  return (
    <View style={{ width, height }}>
      <Image
        source={{
          uri:
            item.kind === 'video' ? item.posterUrl ?? item.thumbUrl : item.url,
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
      {item.kind === 'video' ? (
        <View style={styles.center} pointerEvents="none">
          <View style={styles.play}>
            <Icon icon={Play} size={34} rawColor="#FFFFFF" />
          </View>
          <Text variant="label" style={[styles.white, styles.videoNote]}>
            {formatDuration(item.durationSec)} · Video playback arrives with
            Phase 3
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingBottom: 6,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.8)' },
  play: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoNote: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
