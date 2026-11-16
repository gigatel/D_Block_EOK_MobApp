import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Clock, MapPin, Users } from 'lucide-react-native';
import {
  Badge,
  Card,
  DateBadge,
  Icon,
  Text,
  type Tone,
} from '@/components';
import { useTheme } from '@/theme';
import type { RsvpStatus, RwaEvent } from '@/types/models';
import { formatTime, timeUntil } from '@/utils/date';
import { EventCover } from './EventCover';
import { Scrim } from './Scrim';
import { EVENT_ICON } from './icons';

const RSVP_TONE: Record<RsvpStatus, Tone> = {
  Going: 'success',
  Maybe: 'warning',
  NotGoing: 'neutral',
};
export const RSVP_LABEL: Record<RsvpStatus, string> = {
  Going: 'You’re going',
  Maybe: 'Maybe',
  NotGoing: 'Not going',
};

type Props = {
  event: RwaEvent;
  onPress: () => void;
  going?: number;
  myStatus?: RsvpStatus;
  past?: boolean;
};

/** Full-width event card for lists. */
export function EventCard({ event, onPress, going, myStatus, past }: Props) {
  const theme = useTheme();
  return (
    <Card
      padding="none"
      onPress={onPress}
      accessibilityLabel={`${event.title}, ${event.category}, ${formatTime(
        event.startsAt,
      )}, ${event.venue}${myStatus ? `, ${RSVP_LABEL[myStatus]}` : ''}`}
      style={styles.card}
    >
      <View style={styles.coverWrap}>
        <EventCover event={event} style={styles.cover} />
        <Scrim to={0.55} />
        <View style={[styles.badgeRow, { padding: theme.spacing.md }]}>
          <Badge
            label={event.category}
            tone="accent"
            icon={EVENT_ICON[event.category]}
          />
          {myStatus ? (
            <Badge label={RSVP_LABEL[myStatus]} tone={RSVP_TONE[myStatus]} />
          ) : null}
        </View>
        {!past ? (
          <Text
            variant="label"
            style={[
              styles.countdown,
              { left: theme.spacing.md, bottom: theme.spacing.md },
            ]}
          >
            {timeUntil(event.startsAt)}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.body,
          { padding: theme.spacing.lg, gap: theme.spacing.md },
        ]}
      >
        <DateBadge date={event.startsAt} variant={past ? 'light' : 'solid'} />
        <View style={styles.info}>
          <Text variant="title" numberOfLines={2}>
            {event.title}
          </Text>
          {event.summary ? (
            <Text variant="small" color="muted" numberOfLines={2}>
              {event.summary}
            </Text>
          ) : null}
          <View style={styles.meta}>
            <Icon icon={Clock} size={14} color="muted" />
            <Text variant="small" color="muted">
              {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
            </Text>
          </View>
          <View style={styles.meta}>
            <Icon icon={MapPin} size={14} color="muted" />
            <Text
              variant="small"
              color="muted"
              numberOfLines={1}
              style={styles.flex}
            >
              {event.venue}
            </Text>
          </View>
          {going ? (
            <View style={styles.meta}>
              <Icon icon={Users} size={14} color="primary" />
              <Text variant="small" color="primary">
                {going} {going === 1 ? 'family' : 'families'} going
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/** Compact card for horizontal carousels. */
export function EventTile({
  event,
  onPress,
  width,
  myStatus,
}: {
  event: RwaEvent;
  onPress: () => void;
  width: number;
  myStatus?: RsvpStatus;
}) {
  const theme = useTheme();
  return (
    <Card
      padding="none"
      onPress={onPress}
      style={[styles.card, { width }]}
      accessibilityLabel={`${event.title}, ${timeUntil(event.startsAt)}`}
    >
      <View style={styles.tileCover}>
        <EventCover event={event} style={StyleSheet.absoluteFill} />
        <Scrim from={0.05} to={0.8} />
        <View style={[styles.tileTop, { padding: theme.spacing.md }]}>
          <DateBadge date={event.startsAt} />
          {myStatus ? (
            <Badge label={RSVP_LABEL[myStatus]} tone={RSVP_TONE[myStatus]} />
          ) : null}
        </View>
        <View style={[styles.tileBottom, { padding: theme.spacing.md }]}>
          <Text variant="overline" style={styles.white}>
            {event.category} · {timeUntil(event.startsAt)}
          </Text>
          <Text variant="title" style={styles.white} numberOfLines={2}>
            {event.title}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  coverWrap: { height: 150 },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  countdown: { position: 'absolute', color: '#FFFFFF' },
  body: { flexDirection: 'row' },
  info: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  tileCover: { height: 210, justifyContent: 'space-between' },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tileBottom: { gap: 2 },
  white: { color: '#FFFFFF' },
});
