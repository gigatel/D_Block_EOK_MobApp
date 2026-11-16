import React, { useState } from 'react';
import { View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Pin, Send, Type } from 'lucide-react-native';
import {
  Button,
  Card,
  Input,
  SegmentedControl,
  SwitchRow,
  Text,
} from '@/components';
import {
  announcementFormSchema,
  fieldErrors,
  type AnnouncementForm,
} from '@/features/admin/schemas';
import { useBootstrap, useSave } from '@/features/data';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/store/session';
import { ANNOUNCEMENT_CATEGORIES, type Announcement } from '@/types/models';
import { formatDate } from '@/utils/date';
import { haptic } from '@/utils/haptics';
import { newId } from '@/utils/ids';
import { AdminScreen, ChipGrid } from './components';

type Expiry = 'none' | '7' | '30' | 'keep';
const DAY = 86_400_000;

export function AnnouncementEditorScreen() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<RootStackParamList, 'AnnouncementEditor'>>();
  const { data } = useBootstrap();
  const userName = useSession(s => s.user?.name ?? 'RWA Committee');
  const existing = params?.id
    ? data?.announcements.find(a => a.id === params.id)
    : undefined;
  const save = useSave();

  const [form, setForm] = useState<Omit<AnnouncementForm, 'expiresAt'>>({
    title: existing?.title ?? '',
    category: existing?.category ?? 'Notice',
    visibility: existing?.visibility ?? 'Residents',
    pinned: existing?.pinned ?? false,
    body: existing?.body ?? '',
  });
  const [expiry, setExpiry] = useState<Expiry>(
    existing?.expiresAt ? 'keep' : 'none',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const expiresAt =
    expiry === 'none'
      ? null
      : expiry === 'keep'
      ? existing?.expiresAt ?? null
      : new Date(Date.now() + Number(expiry) * DAY).toISOString();

  const submit = async () => {
    const parsed = announcementFormSchema.safeParse({ ...form, expiresAt });
    if (!parsed.success) {
      haptic('error');
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const body: Announcement = {
      ...(existing ?? {}),
      ...parsed.data,
      id: existing?.id ?? newId('an'),
      author: existing?.author ?? userName,
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
      attachmentName: existing?.attachmentName ?? null,
    };
    try {
      await save.mutateAsync({
        collection: 'announcements',
        id: body.id,
        body,
        successMessage: existing
          ? 'Announcement updated'
          : 'Announcement published',
      });
      navigation.goBack();
    } catch {
      // toast already shown
    }
  };

  const expiryOptions: Expiry[] = existing?.expiresAt
    ? ['keep', 'none', '7', '30']
    : ['none', '7', '30'];
  return (
    <AdminScreen
      title={existing ? 'Edit announcement' : 'New announcement'}
      permission="announcements.manage"
      modal
      refresh={false}
      footer={
        <Button
          title={existing ? 'Save changes' : 'Publish'}
          icon={Send}
          onPress={submit}
          loading={save.isPending}
        />
      }
    >
      <Input
        label="Title"
        icon={Type}
        value={form.title}
        onChangeText={v => set('title', v)}
        error={errors.title}
        maxLength={120}
        counter
        placeholder="e.g. Water supply interruption on Saturday"
      />
      <ChipGrid
        label="Category"
        options={ANNOUNCEMENT_CATEGORIES}
        value={form.category}
        onChange={v => set('category', v)}
        error={errors.category}
      />
      <View style={{ gap: 8 }}>
        <Text variant="label">Who can see it</Text>
        <SegmentedControl
          options={['Public', 'Residents'] as const}
          value={form.visibility}
          onChange={v => set('visibility', v)}
          labels={{ Public: 'Everyone (public)', Residents: 'Residents only' }}
        />
      </View>
      <Card variant="tinted" padding="sm">
        <SwitchRow
          icon={Pin}
          title="Pin to top"
          subtitle="Pinned notices appear first on the home screen."
          value={form.pinned}
          onChange={v => set('pinned', v)}
        />
      </Card>
      <Input
        label="Message"
        multiline
        value={form.body}
        onChangeText={v => set('body', v)}
        error={errors.body}
        maxLength={4000}
        counter
        placeholder="Write the full notice for residents…"
      />
      <ChipGrid
        label="Expires"
        options={expiryOptions}
        value={expiry}
        onChange={setExpiry}
        labels={{
          none: 'Never',
          '7': 'In 7 days',
          '30': 'In 30 days',
          keep: existing?.expiresAt
            ? `Keep (${formatDate(existing.expiresAt)})`
            : 'Keep',
        }}
      />
      {errors.form ? <Text color="danger">{errors.form}</Text> : null}
    </AdminScreen>
  );
}
