import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Eye,
  Megaphone,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  IconButton,
  ListItem,
  Sheet,
  SkeletonList,
  Text,
} from '@/components';
import {
  activeAnnouncements,
  useBootstrap,
  useRemove,
  useSave,
} from '@/features/data';
import { ANNOUNCEMENT_CATEGORIES, type Announcement } from '@/types/models';
import { formatDate, timeAgo } from '@/utils/date';
import { AdminScreen, ConfirmSheet } from './components';

type Filter = 'All' | (typeof ANNOUNCEMENT_CATEGORIES)[number];
const FILTERS: readonly Filter[] = ['All', ...ANNOUNCEMENT_CATEGORIES];

export function AdminAnnouncementsScreen() {
  const navigation = useNavigation();
  const { data, isLoading, error, refetch } = useBootstrap();
  const save = useSave();
  const remove = useRemove();
  const [filter, setFilter] = useState<Filter>('All');
  const [menuFor, setMenuFor] = useState<Announcement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);

  const list = useMemo(() => {
    if (!data) return [];
    // Admins also see expired notices (sorted pinned → newest).
    const all = [
      ...activeAnnouncements(data),
      ...data.announcements.filter(
        a => a.expiresAt && Date.parse(a.expiresAt) <= Date.now(),
      ),
    ];
    return filter === 'All' ? all : all.filter(a => a.category === filter);
  }, [data, filter]);

  const counts = useMemo(() => {
    const out: Partial<Record<Filter, number>> = {
      All: data?.announcements.length ?? 0,
    };
    for (const a of data?.announcements ?? [])
      out[a.category] = (out[a.category] ?? 0) + 1;
    return out;
  }, [data]);

  const togglePin = (a: Announcement) => {
    setMenuFor(null);
    save.mutate({
      collection: 'announcements',
      id: a.id,
      body: { ...a, pinned: !a.pinned },
      successMessage: a.pinned ? 'Unpinned' : 'Pinned to the top',
    });
  };

  return (
    <AdminScreen
      title="Announcements"
      permission="announcements.manage"
      right={
        <IconButton
          icon={Plus}
          label="New announcement"
          variant="tonal"
          color="primary"
          onPress={() => navigation.navigate('AnnouncementEditor', {})}
        />
      }
    >
      <ChipGroup
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        counts={counts}
      />
      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          message="Publish a notice to keep residents informed."
          actionLabel="New announcement"
          onAction={() => navigation.navigate('AnnouncementEditor', {})}
        />
      ) : (
        list.map((a, i) => {
          const expired =
            !!a.expiresAt && Date.parse(a.expiresAt) <= Date.now();
          return (
            <Appear key={a.id} index={i}>
              <Card
                onPress={() =>
                  navigation.navigate('AnnouncementEditor', { id: a.id })
                }
                accessibilityLabel={`${a.title}. Tap to edit`}
              >
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <View style={styles.badges}>
                      {a.pinned ? (
                        <Badge label="Pinned" tone="accent" icon={Pin} />
                      ) : null}
                      <Badge label={a.category} tone="primary" />
                      <Badge
                        label={a.visibility}
                        tone={a.visibility === 'Public' ? 'success' : 'info'}
                        icon={Eye}
                      />
                      {expired ? (
                        <Badge label="Expired" tone="neutral" />
                      ) : null}
                    </View>
                    <Text variant="title" numberOfLines={2}>
                      {a.title}
                    </Text>
                    <Text variant="small" color="muted" numberOfLines={2}>
                      {a.body}
                    </Text>
                    <Text variant="caption" color="muted">
                      {a.author} · {timeAgo(a.publishedAt)}
                      {a.expiresAt
                        ? ` · expires ${formatDate(a.expiresAt)}`
                        : ''}
                    </Text>
                  </View>
                  <IconButton
                    icon={MoreVertical}
                    label={`Actions for ${a.title}`}
                    onPress={() => setMenuFor(a)}
                  />
                </View>
              </Card>
            </Appear>
          );
        })
      )}
      <Button
        title="New announcement"
        icon={Plus}
        onPress={() => navigation.navigate('AnnouncementEditor', {})}
      />

      <Sheet
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor?.title}
      >
        {menuFor ? (
          <View>
            <ListItem
              icon={Pencil}
              title="Edit"
              onPress={() => {
                const id = menuFor.id;
                setMenuFor(null);
                navigation.navigate('AnnouncementEditor', { id });
              }}
            />
            <ListItem
              icon={menuFor.pinned ? PinOff : Pin}
              title={menuFor.pinned ? 'Unpin' : 'Pin to top'}
              onPress={() => togglePin(menuFor)}
            />
            <ListItem
              icon={Trash2}
              title="Delete"
              destructive
              onPress={() => {
                setConfirmDelete(menuFor);
                setMenuFor(null);
              }}
            />
          </View>
        ) : null}
      </Sheet>

      <ConfirmSheet
        visible={!!confirmDelete}
        title="Delete announcement?"
        message={`“${
          confirmDelete?.title ?? ''
        }” will be removed from the app and website.`}
        loading={remove.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await remove
            .mutateAsync({
              collection: 'announcements',
              id: confirmDelete.id,
              successMessage: 'Announcement deleted',
            })
            .catch(() => undefined);
          setConfirmDelete(null);
        }}
      />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1, gap: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
