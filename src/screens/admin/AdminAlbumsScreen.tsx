import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, FolderPlus, Images, Lock, Users } from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  RemoteImage,
  SegmentedControl,
  Sheet,
  SkeletonList,
  Text,
  ArtCover,
} from '@/components';
import { albumFormSchema, fieldErrors } from '@/features/admin/schemas';
import { albumCover, albumMedia, useBootstrap, useSave } from '@/features/data';
import { useCan } from '@/store/session';
import { useTheme } from '@/theme';
import type { Album, MediaVisibility } from '@/types/models';
import { newId } from '@/utils/ids';
import { slugify, uniqueSlug } from '@/features/admin/helpers';
import { AdminScreen } from './components';

const VIS_ICON = { Public: Eye, Residents: Users, Committee: Lock } as const;
const VIS_TONE = {
  Public: 'success',
  Residents: 'info',
  Committee: 'warning',
} as const;

export function CreateAlbumSheet({
  visible,
  onClose,
  takenSlugs,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  takenSlugs: string[];
  /** Called with the saved album (e.g. to select it on the upload screen). */
  onCreated?: (album: Album) => void;
}) {
  const save = useSave();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [visibility, setVisibility] = useState<MediaVisibility>('Residents');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const parsed = albumFormSchema.safeParse({
      title,
      description,
      year: Number(year),
      visibility,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    const id = newId('al');
    const body: Album = {
      id,
      slug: uniqueSlug(slugify(parsed.data.title), takenSlugs),
      eventId: null,
      coverAssetId: null,
      ...parsed.data,
    };
    try {
      await save.mutateAsync({
        collection: 'albums',
        id,
        body,
        successMessage: 'Album created',
      });
      setTitle('');
      setDescription('');
      setErrors({});
      onCreated?.(body);
      onClose();
    } catch {
      // toast shown
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="New album"
      subtitle="Photos stay on the RWA server; visibility controls who can see them."
      footer={
        <Button
          title="Create album"
          icon={FolderPlus}
          onPress={submit}
          loading={save.isPending}
        />
      }
    >
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        placeholder="e.g. Diwali Milan 2026"
        maxLength={120}
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
        maxLength={1000}
        counter
      />
      <Input
        label="Year"
        value={year}
        onChangeText={t => setYear(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        error={errors.year}
      />
      <View style={styles.gap8}>
        <Text variant="label">Visibility</Text>
        <SegmentedControl
          options={['Public', 'Residents', 'Committee'] as const}
          value={visibility}
          onChange={setVisibility}
        />
      </View>
    </Sheet>
  );
}

export function AdminAlbumsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const canManage = useCan('albums.manage');
  const canUpload = useCan('media.upload');
  const { data, isLoading, error, refetch } = useBootstrap();
  const [creating, setCreating] = useState(false);
  const cols = width >= 720 ? 3 : 2;
  const cardWidth =
    (Math.min(width, 1000) - theme.gutter * 2 - theme.spacing.md * (cols - 1)) /
    cols;

  return (
    <AdminScreen
      title="Albums & uploads"
      permission={['albums.manage', 'media.upload']}
      right={
        canManage ? (
          <IconButton
            icon={FolderPlus}
            label="New album"
            variant="tonal"
            color="primary"
            onPress={() => setCreating(true)}
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <SkeletonList count={3} height={180} />
      ) : error || !data ? (
        <ErrorState
          message={error?.message ?? 'Could not load albums.'}
          onRetry={() => refetch()}
        />
      ) : data.albums.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No albums yet"
          actionLabel={canManage ? 'Create album' : undefined}
          onAction={() => setCreating(true)}
        />
      ) : (
        <View style={[styles.grid, { gap: theme.spacing.md }]}>
          {data.albums.map((al, i) => {
            const items = albumMedia(data, al.id);
            const videos = items.filter(m => m.kind === 'video').length;
            const processing = items.filter(m => m.status !== 'Ready').length;
            const cover = albumCover(data, al);
            return (
              <Appear key={al.id} index={i} style={{ width: cardWidth }}>
                <Card
                  padding="none"
                  onPress={() =>
                    canUpload
                      ? navigation.navigate('AlbumUpload', { albumId: al.id })
                      : navigation.navigate('AlbumDetail', { albumId: al.id })
                  }
                  accessibilityLabel={`${al.title}, ${items.length} items, ${al.visibility}`}
                  style={styles.card}
                >
                  {cover ? (
                    <RemoteImage uri={cover.thumbUrl} style={styles.cover} />
                  ) : (
                    <ArtCover seed={al.id} icon={Images} style={styles.cover} />
                  )}
                  <View style={{ padding: theme.spacing.md, gap: 6 }}>
                    <Badge
                      label={al.visibility}
                      tone={VIS_TONE[al.visibility]}
                      icon={VIS_ICON[al.visibility]}
                    />
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {al.title}
                    </Text>
                    <Text variant="caption" color="muted">
                      {items.length - videos} photos · {videos} videos ·{' '}
                      {al.year}
                    </Text>
                    {processing ? (
                      <Badge
                        label={`${processing} processing`}
                        tone="warning"
                      />
                    ) : null}
                  </View>
                </Card>
              </Appear>
            );
          })}
        </View>
      )}
      {canManage ? (
        <Button
          title="Create album"
          icon={FolderPlus}
          variant="secondary"
          onPress={() => setCreating(true)}
        />
      ) : null}
      {canUpload ? (
        <Text variant="small" color="muted" align="center">
          Tap an album to upload photos and videos.
        </Text>
      ) : null}
      <CreateAlbumSheet
        visible={creating}
        onClose={() => setCreating(false)}
        takenSlugs={data?.albums.map(a => a.slug) ?? []}
      />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { overflow: 'hidden' },
  cover: { height: 120 },
});
