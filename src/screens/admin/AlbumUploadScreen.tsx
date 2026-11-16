import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  FileImage,
  FileVideo,
  FolderPlus,
  ImagePlus,
  Loader,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  IconButton,
  ListItem,
  ProgressBar,
  Sheet,
  Text,
  type Tone,
} from '@/components';
import { formatBytes, runPool } from '@/features/admin/helpers';
import { albumMedia, useBootstrap } from '@/features/data';
import { pickMedia, recentAlbumOptions, type PickedFile } from '@/features/media';
import type { RootStackParamList } from '@/navigation/types';
import { data as dataService, toApiError } from '@/services';
import { scanMedia } from '@/services/contentSafety';
import { useCan } from '@/store/session';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { AdminScreen } from './components';
import { CreateAlbumSheet } from './AdminAlbumsScreen';

type ItemStatus =
  | 'Checking'
  | 'Queued'
  | 'Uploading'
  | 'Processing'
  | 'Ready'
  | 'Failed'
  | 'Blocked'
  | 'Rejected';
type QueueItem = PickedFile & {
  key: string;
  status: ItemStatus;
  progress: number;
  error?: string;
};

const STATUS: Record<ItemStatus, { tone: Tone; label: (p: number) => string }> =
  {
    Checking: { tone: 'info', label: () => 'Checking content…' },
    Queued: { tone: 'neutral', label: () => 'Ready to upload' },
    Uploading: {
      tone: 'info',
      label: p => `Uploading ${Math.round(p * 100)}%`,
    },
    Processing: { tone: 'warning', label: () => 'Processing on server' },
    Ready: { tone: 'success', label: () => 'Uploaded' },
    Failed: { tone: 'danger', label: () => 'Failed' },
    Blocked: { tone: 'danger', label: () => 'Blocked' },
    Rejected: { tone: 'danger', label: () => 'Not allowed' },
  };

const DONE: ItemStatus[] = ['Ready', 'Processing'];
const OUT: ItemStatus[] = ['Blocked', 'Rejected'];

let seq = 0;

export function AlbumUploadScreen() {
  const theme = useTheme();
  const qc = useQueryClient();
  const { params } = useRoute<RouteProp<RootStackParamList, 'AlbumUpload'>>();
  const { data } = useBootstrap();
  const canCreateAlbum = useCan('albums.manage');
  const [albumId, setAlbumId] = useState<string | undefined>(params?.albumId);
  const [choosingAlbum, setChoosingAlbum] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [picking, setPicking] = useState(false);
  const [running, setRunning] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const options = useMemo(() => (data ? recentAlbumOptions(data) : []), [data]);
  const selected = options.find(o => o.album.id === albumId);
  const maxMb = data?.settings.maxUploadMb ?? 200;

  const patch = useCallback((key: string, p: Partial<QueueItem>) => {
    setQueue(q => q.map(it => (it.key === key ? { ...it, ...p } : it)));
  }, []);

  /** Every picked file is screened on-device before it can be queued. */
  const check = useCallback(
    async (item: QueueItem) => {
      const verdict = await scanMedia(item.uri, item.kind);
      if (verdict.ok) {
        patch(item.key, { status: 'Queued' });
      } else {
        patch(item.key, { status: 'Blocked', error: verdict.message });
      }
    },
    [patch],
  );

  const addFiles = async () => {
    setPicking(true);
    try {
      const res = await pickMedia();
      if ('error' in res) {
        toast(res.error, 'error');
        return;
      }
      if ('cancelled' in res || !res.files.length) return;
      const items = res.files.map<QueueItem>(f => {
        const error = !f.supported
          ? 'Unsupported format. Use JPEG, PNG, WebP, MP4 or MOV.'
          : f.sizeBytes > maxMb * 1_000_000
          ? `Larger than the ${maxMb} MB limit`
          : undefined;
        return {
          ...f,
          key: `q${++seq}`,
          status: error ? 'Rejected' : 'Checking',
          progress: 0,
          error,
        };
      });
      setQueue(q => [...q, ...items]);
      await runPool(
        items.filter(i => i.status === 'Checking'),
        1,
        check,
      );
      const blocked = queueRef.current.filter(
        i => items.some(n => n.key === i.key) && i.status === 'Blocked',
      ).length;
      if (blocked) {
        haptic('warning');
        toast(
          `${blocked} file${blocked > 1 ? 's were' : ' was'} blocked by the content check.`,
          'error',
        );
      }
    } finally {
      setPicking(false);
    }
  };

  const uploadOne = useCallback(
    async (item: QueueItem) => {
      if (!albumId) return;
      patch(item.key, { status: 'Uploading', progress: 0, error: undefined });
      try {
        const asset = await dataService.uploadMedia(albumId, item, p =>
          patch(item.key, { progress: p }),
        );
        patch(item.key, {
          status: asset.status === 'Ready' ? 'Ready' : 'Processing',
          progress: 1,
        });
      } catch (e) {
        patch(item.key, { status: 'Failed', error: toApiError(e).message });
      }
    },
    [albumId, patch],
  );

  const startAll = async (only?: QueueItem[]) => {
    if (!albumId) {
      toast('Choose an album first.', 'error');
      setChoosingAlbum(true);
      return;
    }
    const pending = only ?? queueRef.current.filter(i => i.status === 'Queued');
    if (!pending.length) return;
    setRunning(true);
    await runPool(pending, 2, uploadOne);
    setRunning(false);
    await qc.invalidateQueries({ queryKey: ['bootstrap'] });
    const failed = queueRef.current.filter(i => i.status === 'Failed').length;
    haptic(failed ? 'warning' : 'success');
    toast(
      failed ? `${failed} upload(s) failed — tap Retry.` : 'Upload complete',
      failed ? 'error' : 'success',
    );
  };

  const stats = useMemo(() => {
    const active = queue.filter(i => !OUT.includes(i.status));
    const bytes = active.reduce((s, i) => s + i.sizeBytes, 0);
    const done = active.reduce(
      (s, i) => s + i.sizeBytes * (DONE.includes(i.status) ? 1 : i.progress),
      0,
    );
    return {
      total: active.length,
      done: active.filter(i => DONE.includes(i.status)).length,
      failed: active.filter(i => i.status === 'Failed').length,
      queued: active.filter(i => i.status === 'Queued').length,
      checking: active.filter(i => i.status === 'Checking').length,
      progress: bytes ? done / bytes : 0,
      bytes,
    };
  }, [queue]);

  const existing = data && albumId ? albumMedia(data, albumId).length : 0;

  return (
    <AdminScreen
      title="Upload to gallery"
      permission="media.upload"
      refresh={false}
      right={
        <IconButton
          icon={ImagePlus}
          label="Add photos or videos"
          variant="tonal"
          color="primary"
          onPress={addFiles}
        />
      }
      footer={
        stats.queued ? (
          <Button
            title={`Upload ${stats.queued} file${stats.queued > 1 ? 's' : ''}`}
            icon={UploadCloud}
            onPress={() => startAll()}
            loading={running}
            disabled={!albumId || stats.checking > 0}
          />
        ) : (
          <Button
            title="Choose photos or videos"
            icon={ImagePlus}
            variant="secondary"
            onPress={addFiles}
            loading={picking}
          />
        )
      }
    >
      {/* Album dropdown */}
      <View style={styles.gap6}>
        <Text variant="label">Album</Text>
        <Card
          variant="outlined"
          padding="sm"
          onPress={() => setChoosingAlbum(true)}
          accessibilityLabel={
            selected
              ? `Album: ${selected.album.title}. Tap to change`
              : 'Choose an album'
          }
        >
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text
                variant="bodyStrong"
                color={selected ? 'text' : 'muted'}
                numberOfLines={1}
              >
                {selected?.album.title ?? 'Choose a festival album'}
              </Text>
              <Text variant="caption" color="muted" numberOfLines={1}>
                {selected
                  ? `${selected.subtitle} · ${existing} items`
                  : 'Recent albums first, or create a new one'}
              </Text>
            </View>
            <Icon icon={ChevronDown} color="muted" />
          </View>
        </Card>
      </View>

      <Card variant="tinted">
        <View style={styles.row}>
          <Icon icon={ShieldCheck} color="primary" />
          <Text variant="small" color="muted" style={styles.flex}>
            Every photo and video is checked on your phone before upload. Max {maxMb} MB per
            file · JPEG, PNG, WebP, MP4, MOV.
          </Text>
        </View>
      </Card>

      {queue.length ? (
        <Card
          accessibilityLabel={`Overall progress ${Math.round(
            stats.progress * 100,
          )} percent`}
        >
          <View style={styles.rowBetween}>
            <Text variant="title">
              {stats.done} of {stats.total} uploaded
            </Text>
            <Text variant="small" color="muted">
              {formatBytes(stats.bytes)}
            </Text>
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <ProgressBar
              value={stats.progress}
              color={stats.failed ? 'warning' : 'primary'}
              height={10}
            />
          </View>
          {stats.failed ? (
            <Button
              title={`Retry ${stats.failed} failed`}
              icon={RotateCcw}
              size="sm"
              variant="soft"
              fullWidth={false}
              style={{ marginTop: theme.spacing.md }}
              onPress={() =>
                startAll(queueRef.current.filter(i => i.status === 'Failed'))
              }
            />
          ) : null}
        </Card>
      ) : (
        <EmptyState
          icon={UploadCloud}
          title="Nothing selected"
          message="Choose photos or videos from your gallery to add them to the album."
          actionLabel="Choose from gallery"
          onAction={addFiles}
        />
      )}

      {queue.map((it, i) => (
        <Appear key={it.key} index={i}>
          <QueueRow
            item={it}
            onRetry={() => startAll([it])}
            onRemove={() => setQueue(q => q.filter(x => x.key !== it.key))}
          />
        </Appear>
      ))}

      <Sheet
        visible={choosingAlbum}
        onClose={() => setChoosingAlbum(false)}
        title="Choose album"
        subtitle="Most recent festival albums first."
      >
        <View>
          {canCreateAlbum ? (
            <ListItem
              icon={FolderPlus}
              iconColor="primary"
              title="Create new album"
              subtitle="For a new festival or event"
              onPress={() => {
                setChoosingAlbum(false);
                setCreatingAlbum(true);
              }}
            />
          ) : null}
          {options.length ? (
            options.map(o => (
              <ListItem
                key={o.album.id}
                icon={FileImage}
                title={o.album.title}
                subtitle={o.subtitle}
                chevron={false}
                right={
                  o.album.id === albumId ? (
                    <Icon icon={Check} color="primary" />
                  ) : undefined
                }
                onPress={() => {
                  setAlbumId(o.album.id);
                  setChoosingAlbum(false);
                }}
              />
            ))
          ) : (
            <Text color="muted" style={styles.pad}>
              No albums yet.
              {canCreateAlbum
                ? ' Create one above.'
                : ' Ask a committee member to create one.'}
            </Text>
          )}
        </View>
      </Sheet>

      <CreateAlbumSheet
        visible={creatingAlbum}
        onClose={() => setCreatingAlbum(false)}
        takenSlugs={(data?.albums ?? []).map(a => a.slug)}
        onCreated={album => setAlbumId(album.id)}
      />
    </AdminScreen>
  );
}

function QueueRow({
  item: it,
  onRetry,
  onRemove,
}: {
  item: QueueItem;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const s = STATUS[it.status];
  const statusIcon =
    it.status === 'Ready'
      ? CircleCheck
      : it.status === 'Blocked'
      ? ShieldAlert
      : it.status === 'Failed' || it.status === 'Rejected'
      ? CircleAlert
      : Loader;
  // Never preview a blocked file.
  const preview = it.kind === 'image' && it.status !== 'Blocked';
  return (
    <Card padding="sm">
      <View style={styles.row}>
        <View
          style={[
            styles.fileIcon,
            {
              backgroundColor:
                it.status === 'Blocked'
                  ? theme.colors.dangerSoft
                  : theme.colors.primarySoft,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          {preview ? (
            <Image
              source={{ uri: it.uri }}
              style={[styles.thumb, { borderRadius: theme.radius.md }]}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon
              icon={
                it.status === 'Blocked'
                  ? ShieldAlert
                  : it.kind === 'video'
                  ? FileVideo
                  : FileImage
              }
              color={it.status === 'Blocked' ? 'danger' : 'primary'}
            />
          )}
        </View>
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {it.name}
          </Text>
          <View style={styles.meta}>
            {it.sizeBytes ? (
              <Text variant="caption" color="muted">
                {formatBytes(it.sizeBytes)}
              </Text>
            ) : null}
            <Badge
              label={s.label(it.progress)}
              tone={s.tone}
              icon={statusIcon}
            />
          </View>
        </View>
        {it.status === 'Failed' ? (
          <IconButton
            icon={RotateCcw}
            label={`Retry ${it.name}`}
            color="primary"
            onPress={onRetry}
          />
        ) : it.status === 'Queued' || OUT.includes(it.status) ? (
          <IconButton
            icon={Trash2}
            label={`Remove ${it.name}`}
            color="muted"
            onPress={onRemove}
          />
        ) : null}
      </View>
      {it.status === 'Uploading' || DONE.includes(it.status) ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <ProgressBar
            value={it.progress}
            color={it.status === 'Ready' ? 'success' : 'primary'}
            height={6}
          />
        </View>
      ) : null}
      {it.error ? (
        <Text variant="caption" color="danger" style={styles.marginTop6}>
          {it.error}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  marginTop6: { marginTop: 6 },
  gap6: { gap: 6 },
  pad: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex: { flex: 1, gap: 4 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fileIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: { width: 48, height: 48 },
});
