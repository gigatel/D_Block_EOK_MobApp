import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  Globe,
  Image as ImageIcon,
  MapPin,
  Plus,
  Save,
  Ticket,
  Type,
  Users,
  X,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  PressableScale,
  RemoteImage,
  SwitchRow,
  Text,
} from '@/components';
import {
  isoToIst,
  istToIso,
  nextDays,
  slugify,
  TIME_SLOTS,
  uniqueSlug,
} from '@/features/admin/helpers';
import { eventFormSchema, fieldErrors } from '@/features/admin/schemas';
import { useBootstrap, useSave } from '@/features/data';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme';
import {
  EVENT_CATEGORIES,
  type EventCategory,
  type RwaEvent,
} from '@/types/models';
import { haptic } from '@/utils/haptics';
import { newId } from '@/utils/ids';
import { AdminScreen, ChipGrid, DayStrip, TimeStrip } from './components';

export function EventEditorScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'EventEditor'>>();
  const { data } = useBootstrap();
  const existing = params?.id
    ? data?.events.find(e => e.id === params.id)
    : undefined;
  const save = useSave();

  const start0 = existing
    ? isoToIst(existing.startsAt)
    : { day: nextDays(8)[7], minutes: 18 * 60 };
  const end0 = existing
    ? isoToIst(existing.endsAt)
    : { day: start0.day, minutes: 21 * 60 };

  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState<EventCategory>(
    existing?.category ?? 'Community',
  );
  const [summary, setSummary] = useState(existing?.summary ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [venue, setVenue] = useState(
    existing?.venue ?? 'Central Park, D Block',
  );
  const [day, setDay] = useState(start0.day);
  const [startMin, setStartMin] = useState(start0.minutes);
  const [endMin, setEndMin] = useState(
    end0.day === start0.day ? end0.minutes : 23 * 60 + 30,
  );
  const [registrationOpen, setRegistrationOpen] = useState(
    existing?.registrationOpen ?? true,
  );
  const [capacity, setCapacity] = useState(
    existing?.capacity ? String(existing.capacity) : '',
  );
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? true);
  const [highlights, setHighlights] = useState<string[]>(
    existing?.highlights ?? [],
  );
  const [newHighlight, setNewHighlight] = useState('');
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Next 60 days, plus the existing event's day if it is in the past or further out.
  const days = useMemo(() => {
    const list = nextDays(60);
    return list.includes(start0.day) ? list : [start0.day, ...list];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const slots = useMemo(() => {
    const set = new Set([...TIME_SLOTS, startMin, endMin]);
    return [...set].sort((a, b) => a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addHighlight = () => {
    const h = newHighlight.trim();
    if (!h || highlights.includes(h) || highlights.length >= 10) return;
    haptic('selection');
    setHighlights([...highlights, h]);
    setNewHighlight('');
  };

  const submit = async () => {
    const values = {
      title,
      category,
      summary,
      description,
      venue,
      startsAt: istToIso(day, startMin),
      endsAt: istToIso(day, endMin),
      registrationOpen,
      capacity: capacity.trim() ? Number(capacity) : null,
      isPublic,
      highlights,
      coverImage: coverImage.trim(),
    };
    const parsed = eventFormSchema.safeParse(values);
    if (!parsed.success) {
      haptic('error');
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const taken = (data?.events ?? [])
      .filter(e => e.id !== existing?.id)
      .map(e => e.slug);
    const body: RwaEvent = {
      ...(existing ?? {}),
      ...parsed.data,
      id: existing?.id ?? newId('ev'),
      slug: existing?.slug ?? uniqueSlug(slugify(parsed.data.title), taken),
      coverImage: parsed.data.coverImage,
      albumId: existing?.albumId ?? null,
    };
    try {
      await save.mutateAsync({
        collection: 'events',
        id: body.id,
        body,
        successMessage: existing ? 'Event updated' : 'Event created',
      });
      navigation.goBack();
    } catch {
      // toast shown by useSave
    }
  };

  return (
    <AdminScreen
      title={existing ? 'Edit event' : 'New event'}
      permission="events.manage"
      modal
      refresh={false}
      footer={
        <Button
          title={existing ? 'Save changes' : 'Create event'}
          icon={Save}
          onPress={submit}
          loading={save.isPending}
        />
      }
    >
      <Input
        label="Title"
        icon={Type}
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        maxLength={120}
        counter
        placeholder="e.g. Diwali Milan & Rangoli Competition"
      />
      {title.trim() && !existing ? (
        <Text variant="caption" color="muted">
          Link: /events/{slugify(title)}
        </Text>
      ) : null}
      <ChipGrid
        label="Category"
        options={EVENT_CATEGORIES}
        value={category}
        onChange={setCategory}
      />
      <Input
        label="Summary"
        value={summary}
        onChangeText={setSummary}
        error={errors.summary}
        maxLength={300}
        counter
        multiline
        placeholder="One or two lines shown on cards"
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
        placeholder="Programme, what to bring, timings…"
      />
      <Input
        label="Venue"
        icon={MapPin}
        value={venue}
        onChangeText={setVenue}
        error={errors.venue}
      />

      <Card variant="tinted" style={{ gap: theme.spacing.lg }}>
        <DayStrip label="Date" days={days} value={day} onChange={setDay} />
        <TimeStrip
          label="Starts"
          slots={slots}
          value={startMin}
          onChange={m => {
            setStartMin(m);
            if (endMin <= m) setEndMin(Math.min(m + 120, 23 * 60 + 30));
          }}
        />
        <TimeStrip
          label="Ends"
          slots={slots}
          value={endMin}
          onChange={setEndMin}
          error={errors.endsAt}
        />
      </Card>

      <Card variant="tinted" padding="sm">
        <SwitchRow
          icon={Ticket}
          title="Registration open"
          subtitle="Residents can RSVP with adults & children."
          value={registrationOpen}
          onChange={setRegistrationOpen}
        />
        <SwitchRow
          icon={Globe}
          title="Public event"
          subtitle="Visible on the public website and app without sign-in."
          value={isPublic}
          onChange={setIsPublic}
        />
      </Card>
      <Input
        label="Capacity (optional)"
        icon={Users}
        value={capacity}
        onChangeText={t => setCapacity(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        error={errors.capacity}
        hint="Total people (adults + children). Leave empty for no limit."
      />

      <View style={styles.gap8}>
        <Text variant="label">Highlights</Text>
        <View style={styles.wrap}>
          {highlights.map(h => (
            <PressableScale
              key={h}
              onPress={() => setHighlights(highlights.filter(x => x !== h))}
              accessibilityLabel={`Remove highlight ${h}`}
              style={styles.chip}
            >
              <Badge label={h} tone="accent" icon={X} />
            </PressableScale>
          ))}
          {!highlights.length ? (
            <Text variant="small" color="muted">
              Add up to 10 short highlights.
            </Text>
          ) : null}
        </View>
        <Input
          label="Add highlight"
          value={newHighlight}
          onChangeText={setNewHighlight}
          maxLength={60}
          onSubmitEditing={addHighlight}
          returnKeyType="done"
          error={errors.highlights}
          right={
            <IconButton
              icon={Plus}
              label="Add highlight"
              color="primary"
              onPress={addHighlight}
            />
          }
        />
      </View>

      <Input
        label="Cover image URL (optional)"
        icon={ImageIcon}
        value={coverImage}
        onChangeText={setCoverImage}
        autoCapitalize="none"
        keyboardType="url"
        error={errors.coverImage}
        hint="Phase 3 adds picking a photo from the gallery."
      />
      {coverImage.trim().startsWith('http') ? (
        <RemoteImage
          uri={coverImage.trim()}
          style={styles.cover}
          radius={theme.radius.lg}
          accessibilityLabel="Cover preview"
        />
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 32, justifyContent: 'center' },
  cover: { height: 170 },
});
