import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  Clock,
  Images,
  LogIn,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Input,
  ListItem,
  ProgressBar,
  Screen,
  SegmentedControl,
  Sheet,
  Skeleton,
  Text,
} from '@/components';
import {
  albumMedia,
  myRegistration,
  rsvpSummary,
  useBootstrap,
  useSave,
} from '@/features/data';
import { useLightStatusBar } from '@/hooks/useStatusBar';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import type { Bootstrap } from '@/types/bootstrap';
import type { RsvpStatus, RwaEvent } from '@/types/models';
import { formatDateLong, formatTime, timeUntil } from '@/utils/date';
import { newId } from '@/utils/ids';
import { RSVP_LABEL } from './components/EventCard';
import { EventCover } from './components/EventCover';
import { Scrim } from './components/Scrim';
import { Stepper } from './components/Stepper';
import { EVENT_ICON } from './components/icons';

export function EventDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'EventDetail'>>();
  const q = useBootstrap();
  const signedIn = useSession(s => s.status === 'signedIn');
  const [sheet, setSheet] = useState(false);
  useLightStatusBar();

  const b = q.data;
  const event = useMemo(
    () =>
      b?.events.find(
        e =>
          (params.id && e.id === params.id) ||
          (params.slug && e.slug === params.slug),
      ),
    [b, params.id, params.slug],
  );

  const back = (
    <View
      style={[
        styles.back,
        { top: insets.top + theme.spacing.xs, left: theme.spacing.sm },
      ]}
    >
      <IconButton
        icon={ArrowLeft}
        label="Go back"
        variant="glass"
        color="onPrimary"
        onPress={() => navigation.goBack()}
      />
    </View>
  );

  if (!b || !event) {
    return (
      <Screen bleed contentStyle={styles.noTop}>
        {!b && q.isLoading ? (
          <>
            <Skeleton height={300} radius={0} />
            <View style={{ padding: theme.gutter, gap: theme.spacing.md }}>
              <Skeleton height={28} width="70%" />
              <Skeleton height={120} radius={theme.radius.lg} />
            </View>
          </>
        ) : !b ? (
          <View style={{ paddingTop: insets.top + 60 }}>
            <ErrorState
              message={q.error?.message ?? 'Please check your connection.'}
              onRetry={q.refetch}
            />
          </View>
        ) : (
          <View style={{ paddingTop: insets.top + 60 }}>
            <EmptyState
              icon={CalendarDays}
              title="Event not found"
              message="It may have been removed or is for residents only."
              actionLabel={signedIn ? undefined : 'Sign in'}
              onAction={() => navigation.navigate('Login')}
            />
          </View>
        )}
        {back}
      </Screen>
    );
  }

  const summary = rsvpSummary(b, event.id);
  const mine = myRegistration(b, event.id);
  const ended = Date.parse(event.endsAt) < Date.now();
  const album = event.albumId
    ? b.albums.find(a => a.id === event.albumId)
    : undefined;

  const footer = ended ? null : !event.registrationOpen ? (
    <Text variant="small" color="muted" align="center">
      Registration is not required — just come along!
    </Text>
  ) : signedIn ? (
    <Button
      title={
        mine
          ? `Update RSVP · ${RSVP_LABEL[mine.status]}`
          : 'RSVP for this event'
      }
      icon={CalendarCheck}
      variant={mine ? 'secondary' : 'primary'}
      onPress={() => setSheet(true)}
    />
  ) : (
    <Button
      title="Sign in to RSVP"
      icon={LogIn}
      onPress={() => navigation.navigate('Login')}
    />
  );

  return (
    <>
      <Screen
        bleed
        contentStyle={styles.noTop}
        footer={footer}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
      >
        <View style={styles.hero}>
          <EventCover event={event} style={StyleSheet.absoluteFill} />
          <Scrim from={0.35} to={0.8} />
          <View
            style={[
              styles.heroText,
              { padding: theme.gutter, paddingBottom: theme.spacing.xxl },
            ]}
          >
            <View style={styles.badges}>
              <Badge
                label={event.category}
                tone="accent"
                icon={EVENT_ICON[event.category]}
              />
              {!ended ? (
                <Badge label={timeUntil(event.startsAt)} tone="primary" />
              ) : (
                <Badge label="Ended" tone="neutral" />
              )}
              {!event.isPublic ? <Badge label="Residents" tone="info" /> : null}
            </View>
            <Text variant="h1" style={styles.white} accessibilityRole="header">
              {event.title}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.sheetTop,
            {
              marginTop: -theme.spacing.xl,
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              padding: theme.gutter,
              gap: theme.spacing.lg,
            },
          ]}
        >
          <Appear index={0}>
            <Card>
              <ListItem
                icon={CalendarDays}
                title={formatDateLong(event.startsAt)}
                subtitle="Date"
              />
              <ListItem
                icon={Clock}
                title={`${formatTime(event.startsAt)} – ${formatTime(
                  event.endsAt,
                )}`}
                subtitle="Time (IST)"
              />
              <ListItem icon={MapPin} title={event.venue} subtitle="Venue" />
            </Card>
          </Appear>

          {event.registrationOpen || summary.goingFamilies > 0 ? (
            <Appear index={1}>
              <Capacity summary={summary} mine={mine?.status} />
            </Appear>
          ) : null}

          {event.highlights.length ? (
            <Appear index={2} style={{ gap: theme.spacing.sm }}>
              <Text variant="h3">Highlights</Text>
              <View style={styles.highlights}>
                {event.highlights.map(h => (
                  <Badge key={h} label={h} tone="primary" icon={Sparkles} />
                ))}
              </View>
            </Appear>
          ) : null}

          <Appear index={3} style={{ gap: theme.spacing.sm }}>
            <Text variant="h3">About this event</Text>
            <Text>{event.summary}</Text>
            <Text color="muted">{event.description}</Text>
          </Appear>

          {album ? (
            <Appear index={4}>
              <Card variant="tinted" padding="sm">
                <ListItem
                  icon={Images}
                  title={album.title}
                  subtitle={`${albumMedia(b, album.id).length} photos & videos`}
                  onPress={() =>
                    navigation.navigate('AlbumDetail', { albumId: album.id })
                  }
                />
              </Card>
            </Appear>
          ) : null}
        </View>
      </Screen>
      {back}
      {signedIn && !ended ? (
        <RsvpSheet
          visible={sheet}
          onClose={() => setSheet(false)}
          b={b}
          event={event}
        />
      ) : null}
    </>
  );
}

function Capacity({
  summary,
  mine,
}: {
  summary: ReturnType<typeof rsvpSummary>;
  mine?: RsvpStatus;
}) {
  const theme = useTheme();
  return (
    <Card variant="tinted">
      <View style={[styles.capRow, { gap: theme.spacing.md }]}>
        <Icon icon={Users} color="primary" />
        <View style={styles.flex}>
          <Text variant="title">
            {summary.goingFamilies}{' '}
            {summary.goingFamilies === 1 ? 'family' : 'families'} going
          </Text>
          <Text variant="small" color="muted">
            {summary.people} people
            {summary.maybeFamilies ? ` · ${summary.maybeFamilies} maybe` : ''}
          </Text>
        </View>
        {mine ? (
          <Badge
            label={RSVP_LABEL[mine]}
            tone={
              mine === 'Going'
                ? 'success'
                : mine === 'Maybe'
                ? 'warning'
                : 'neutral'
            }
          />
        ) : null}
      </View>
      {summary.capacity ? (
        <View style={[styles.capBar, { marginTop: theme.spacing.md }]}>
          <ProgressBar
            value={summary.people / summary.capacity}
            color={summary.placesLeft === 0 ? 'danger' : 'primary'}
          />
          <Text
            variant="caption"
            color={summary.placesLeft === 0 ? 'danger' : 'muted'}
          >
            {summary.placesLeft === 0
              ? 'Fully booked'
              : `${summary.placesLeft} of ${summary.capacity} places left`}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function RsvpSheet({
  visible,
  onClose,
  b,
  event,
}: {
  visible: boolean;
  onClose: () => void;
  b: Bootstrap;
  event: RwaEvent;
}) {
  const theme = useTheme();
  const user = useSession(s => s.user);
  const save = useSave();
  const mine = myRegistration(b, event.id);
  const [status, setStatus] = useState<RsvpStatus>(mine?.status ?? 'Going');
  const [adults, setAdults] = useState(mine?.adults ?? 2);
  const [children, setChildren] = useState(mine?.children ?? 0);
  const [note, setNote] = useState(mine?.note ?? '');

  useEffect(() => {
    if (visible) {
      setStatus(mine?.status ?? 'Going');
      setAdults(mine?.adults ?? 2);
      setChildren(mine?.children ?? 0);
      setNote(mine?.note ?? '');
    }
  }, [visible, mine]);

  const summary = rsvpSummary(b, event.id);
  const myCurrent = mine?.status === 'Going' ? mine.adults + mine.children : 0;
  const available =
    summary.placesLeft === null ? null : summary.placesLeft + myCurrent;
  const party = adults + children;
  const overCapacity =
    status === 'Going' && available !== null && party > available;
  const attending = status !== 'NotGoing';

  const submit = async () => {
    if (!user || overCapacity) return;
    await save.mutateAsync({
      collection: 'registrations',
      id: mine?.id ?? newId('reg'),
      body: {
        eventId: event.id,
        residentId: user.residentId,
        status,
        adults: attending ? adults : 0,
        children: attending ? children : 0,
        note: note.trim() || null,
      },
      successMessage: status === 'Going' ? 'See you there! 🎉' : 'RSVP updated',
    });
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Your RSVP"
      subtitle={event.title}
      footer={
        <Button
          title={
            status === 'NotGoing'
              ? 'Save — not going'
              : `Confirm · ${party} ${party === 1 ? 'person' : 'people'}`
          }
          icon={CalendarCheck}
          loading={save.isPending}
          disabled={overCapacity || (attending && adults < 1)}
          onPress={() => {
            submit().catch(() => undefined);
          }}
        />
      }
    >
      <SegmentedControl
        options={['Going', 'Maybe', 'NotGoing'] as const}
        labels={{ NotGoing: 'Not going' }}
        value={status}
        onChange={setStatus}
      />
      {attending ? (
        <View style={{ gap: theme.spacing.xs }}>
          <Stepper
            label="Adults"
            hint="13 years and above"
            value={adults}
            min={1}
            max={10}
            onChange={setAdults}
          />
          <Stepper
            label="Children"
            hint="Under 13"
            value={children}
            min={0}
            max={10}
            onChange={setChildren}
          />
        </View>
      ) : null}
      {overCapacity ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          Only {available} {available === 1 ? 'place is' : 'places are'} left.
          Please reduce your party size.
        </Text>
      ) : available !== null && attending ? (
        <Text variant="caption" color="muted">
          {available} places available
        </Text>
      ) : null}
      <Input
        label="Note for the organisers (optional)"
        placeholder="e.g. Bringing a dish, need a wheelchair spot"
        value={note}
        onChangeText={setNote}
        maxLength={300}
        counter
        multiline
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  noTop: { paddingTop: 0, gap: 0 },
  flex: { flex: 1 },
  hero: { height: 330, justifyContent: 'flex-end' },
  heroText: { gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  white: { color: '#FFFFFF' },
  back: { position: 'absolute' },
  sheetTop: {},
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capRow: { flexDirection: 'row', alignItems: 'center' },
  capBar: { gap: 6 },
});
