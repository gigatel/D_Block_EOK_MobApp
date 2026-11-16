import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Images, Lock, Users } from 'lucide-react-native';
import { ArtCover, Badge, Card, RemoteImage, Text } from '@/components';
import { useTheme } from '@/theme';
import type { Album, MediaAsset } from '@/types/models';
import { Scrim } from './Scrim';

export function AlbumCard({
  album,
  cover,
  count,
  onPress,
  width,
}: {
  album: Album;
  cover?: MediaAsset;
  count: number;
  onPress: () => void;
  width?: number;
}) {
  const theme = useTheme();
  const restricted = album.visibility !== 'Public';
  return (
    <Card
      padding="none"
      onPress={onPress}
      accessibilityLabel={`${album.title}, ${count} items${
        restricted ? `, ${album.visibility} only` : ''
      }`}
      style={[styles.card, width ? { width } : styles.flex]}
    >
      <View style={styles.cover}>
        {cover ? (
          <RemoteImage uri={cover.thumbUrl} style={StyleSheet.absoluteFill} />
        ) : (
          <ArtCover
            seed={album.id}
            icon={Images}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Scrim from={0} to={0.7} />
        {restricted ? (
          <View style={[styles.lock, { margin: theme.spacing.sm }]}>
            <Badge
              label={album.visibility}
              tone={album.visibility === 'Committee' ? 'danger' : 'info'}
              icon={album.visibility === 'Committee' ? Lock : Users}
            />
          </View>
        ) : null}
        <View style={[styles.caption, { padding: theme.spacing.md }]}>
          <Text variant="bodyStrong" style={styles.white} numberOfLines={2}>
            {album.title}
          </Text>
          <Text variant="caption" style={styles.whiteSoft}>
            {album.year} · {count} {count === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  flex: { flex: 1 },
  cover: { aspectRatio: 0.95, justifyContent: 'flex-end' },
  lock: { position: 'absolute', top: 0, left: 0 },
  caption: { gap: 2 },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.85)' },
});
