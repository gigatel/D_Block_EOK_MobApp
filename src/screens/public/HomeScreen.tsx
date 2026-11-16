import React, { useMemo } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CloudSun,
  LogIn,
  MessageSquareWarning,
  PhoneCall,
  ShieldCheck,
  Vote,
  type LucideIcon,
  Phone,
  UsersRound,
} from 'lucide-react-native';
import {
  Appear,
  Avatar,
  Badge,
  Button,
  Card,
  DemoBadge,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  PressableScale,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  ThemeHero,
} from '@/components';
import { callNumber } from '@/utils/links';
import {
  activeAnnouncements,
  albumCover,
  albumMedia,
  flatOf,
  me,
  myRegistration,
  unreadCount,
  upcomingEvents,
  useBootstrap,
} from '@/features/data';
import { useLightStatusBar } from '@/hooks/useStatusBar';
import { useIsCommittee, useSession } from '@/store/session';
import { useTheme } from '@/theme';
import type { Bootstrap } from '@/types/bootstrap';
import { partOfDay } from '@/utils/date';
import { AlbumCard } from './components/AlbumCard';
import { AnnouncementCard } from './components/AnnouncementCard';
import { EventTile } from './components/EventCard';

export function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const signedIn = useSession(s => s.status === 'signedIn');
  const user = useSession(s => s.user);
  const q = useBootstrap();
  const b = q.data;
  useLightStatusBar();

  const content = theme.source.content;
  const resident = b ? me(b) : undefined;
  const flat = b && user ? flatOf(b, user.residentId) : undefined;
  const firstName = resident?.firstName ?? user?.name.split(' ')[0] ?? '';
  const weather = b?.settings.showWeather && b.weather ? b.weather : null;
  const unread = b && signedIn ? unreadCount(b) : 0;
  const topBarHeight = theme.touchTarget + theme.spacing.sm;

  return (
    <Screen
      bleed
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
      contentStyle={styles.noTopPad}
    >
      <View>
        {signedIn ? (
          <ThemeHero
            compact
            topInset={insets.top + topBarHeight}
            eyebrow={content.showGreeting ? content.greeting : undefined}
            title={`Good ${partOfDay()}${firstName ? `, ${firstName}` : ''}`}
            subtitle={
              flat
                ? `${flat.houseNo} · ${flat.floor} floor · East of Kailash`
                : 'D Block, East of Kailash'
            }
          />
        ) : (
          <ThemeHero
            topInset={insets.top + topBarHeight}
            eyebrow={content.showGreeting ? content.greeting : 'D Block RWA'}
          >
            <View style={[styles.heroActions, { gap: theme.spacing.sm }]}>
              <Button
                title="Resident sign in"
                icon={LogIn}
                variant="accent"
                fullWidth={false}
                onPress={() => navigation.navigate('Login')}
              />
              <Button
                title="Events"
                icon={CalendarDays}
                variant="secondary"
                fullWidth={false}
                onPress={() =>
                  navigation.navigate('Tabs', { screen: 'Events' })
                }
              />
            </View>
          </ThemeHero>
        )}
        {/* Top bar floats over the hero */}
        <View
          style={[
            styles.topBar,
            {
              top: insets.top,
              paddingHorizontal: theme.gutter,
              minHeight: topBarHeight,
            },
          ]}
        >
          <DemoBadge />
          <View style={styles.flex} />
          {weather ? (
            <View
              style={[styles.weather, { borderRadius: theme.radius.pill }]}
              accessible
              accessibilityLabel={`Weather: ${weather.temperatureC} degrees, ${weather.summary}`}
            >
              <Icon icon={CloudSun} size={15} rawColor="#FFFFFF" />
              <Text variant="caption" style={styles.white}>
                {weather.temperatureC}° · {weather.summary}
              </Text>
            </View>
          ) : null}
          {signedIn ? (
            <IconButton
              icon={Bell}
              label="Notifications"
              variant="glass"
              color="onPrimary"
              badge={unread}
              onPress={() => navigation.navigate('Notifications')}
            />
          ) : null}
        </View>
      </View>

      {!b ? (
        q.isLoading ? (
          <View
            style={[
              styles.section,
              { paddingHorizontal: theme.gutter, gap: theme.spacing.md },
            ]}
          >
            <Skeleton height={22} width="50%" />
            <Skeleton height={200} radius={theme.radius.lg} />
            <Skeleton height={90} radius={theme.radius.lg} />
          </View>
        ) : (
          <ErrorState
            message={q.error?.message ?? 'Please check your connection.'}
            onRetry={q.refetch}
          />
        )
      ) : signedIn ? (
        <Dashboard b={b} />
      ) : (
        <PublicHome b={b} />
      )}
    </Screen>
  );
}

// ---- Resident dashboard ---------------------------------------------------------
function Dashboard({ b }: { b: Bootstrap }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const committee = useIsCommittee();
  const actions: { label: string; icon: LucideIcon; onPress: () => void }[] = [
    {
      label: 'New complaint',
      icon: MessageSquareWarning,
      onPress: () => navigation.navigate('NewComplaint'),
    },
    {
      label: 'Committee',
      icon: UsersRound,
      onPress: () => navigation.navigate('Committee'),
    },
    {
      label: 'Contacts',
      icon: PhoneCall,
      onPress: () => navigation.navigate('Contacts'),
    },
    { label: 'Polls', icon: Vote, onPress: () => navigation.navigate('Polls') },
  ];
  return (
    <>
      <Appear
        index={0}
        style={[styles.section, { paddingHorizontal: theme.gutter }]}
      >
        <View style={[styles.quickGrid, { gap: theme.spacing.sm }]}>
          {actions.map(a => (
            <QuickAction key={a.label} {...a} />
          ))}
        </View>
      </Appear>

      {committee ? (
        <Appear index={1} style={{ paddingHorizontal: theme.gutter }}>
          <Card
            variant="tinted"
            onPress={() => navigation.navigate('AdminDashboard')}
            accessibilityLabel="Open committee tools"
          >
            <View style={[styles.row, { gap: theme.spacing.md }]}>
              <View
                style={[
                  styles.adminIcon,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Icon icon={ShieldCheck} color="onPrimary" />
              </View>
              <View style={styles.flex}>
                <Text variant="title">Committee tools</Text>
                <Text variant="small" color="muted">
                  Notices, events, uploads, complaints and themes
                </Text>
              </View>
              <Icon icon={ChevronRight} color="muted" />
            </View>
          </Card>
        </Appear>
      ) : null}

      <CommitteeCarousel b={b} index={2} />
      <EventsCarousel b={b} index={3} withRsvp />
      <NoticesSection b={b} index={4} />
      <AlbumsCarousel b={b} index={5} />
    </>
  );
}

/** Managing committee on the resident dashboard: who they are + one-tap call. */
function CommitteeCarousel({ b, index }: { b: Bootstrap; index: number }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const members = useMemo(
    () => [...b.committee].sort((a, c) => a.sortOrder - c.sortOrder),
    [b],
  );
  if (members.length === 0) return null;
  const w = 150;
  return (
    <Appear index={index}>
      <View style={{ paddingHorizontal: theme.gutter }}>
        <SectionHeader
          overline="Your RWA"
          title="Managing committee"
          actionLabel={`See all ${members.length}`}
          onAction={() => navigation.navigate('Committee')}
        />
      </View>
      <FlatList
        horizontal
        data={members}
        keyExtractor={m => m.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={w + theme.spacing.md}
        decelerationRate="fast"
        initialNumToRender={4}
        contentContainerStyle={{
          paddingHorizontal: theme.gutter,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
        renderItem={({ item }) => (
          <Card
            padding="md"
            onPress={() => navigation.navigate('Committee')}
            accessibilityLabel={`${item.name}, ${item.designation}`}
            style={[styles.member, { width: w, gap: theme.spacing.xs }]}
          >
            <Avatar name={item.name} color={item.avatarColor} size={56} />
            <Text
              variant="bodyStrong"
              align="center"
              numberOfLines={3}
              style={styles.memberName}
            >
              {item.name}
            </Text>
            <Badge label={item.designation} tone="accent" />
            {item.houseNo ? (
              <Text variant="caption" color="muted">
                {item.houseNo}
              </Text>
            ) : null}
            {item.phone ? (
              <IconButton
                icon={Phone}
                label={`Call ${item.name}`}
                variant="tonal"
                color="primary"
                size={18}
                onPress={() => callNumber(item.phone)}
              />
            ) : null}
          </Card>
        )}
      />
    </Appear>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        styles.quick,
        theme.shadow.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Icon icon={icon} size={22} color="primary" />
      </View>
      <Text
        variant="caption"
        align="center"
        // One-word labels ("Committee") stay on one line and shrink rather than break mid-word.
        numberOfLines={label.includes(' ') ? 2 : 1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={styles.quickLabel}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

// ---- Public home -------------------------------------------------------------------
function PublicHome({ b }: { b: Bootstrap }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const committee = [...b.committee].sort((a, c) => a.sortOrder - c.sortOrder);
  return (
    <>
      <EventsCarousel b={b} index={0} />
      <NoticesSection b={b} index={1} />
      <AlbumsCarousel b={b} index={2} />

      <Appear index={3} style={{ paddingHorizontal: theme.gutter }}>
        <SectionHeader
          overline="Your RWA"
          title="Managing committee"
          actionLabel="Meet all"
          onAction={() => navigation.navigate('Committee')}
        />
        <Card
          onPress={() => navigation.navigate('Committee')}
          accessibilityLabel="Meet the managing committee"
        >
          <View style={styles.avatars}>
            {committee.slice(0, 5).map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.avatarRing,
                  i > 0 && styles.overlap,
                  { borderColor: theme.colors.surface },
                ]}
              >
                <Avatar name={m.name} color={m.avatarColor} size={46} />
              </View>
            ))}
          </View>
          <Text
            variant="small"
            color="muted"
            style={{ marginTop: theme.spacing.sm }}
          >
            {committee[0]
              ? `${committee[0].name} (${committee[0].designation}) and ${
                  committee.length - 1
                } elected members serve D Block.`
              : ''}
          </Text>
        </Card>
      </Appear>

      <Appear
        index={4}
        style={[
          styles.twoUp,
          { paddingHorizontal: theme.gutter, gap: theme.spacing.md },
        ]}
      >
        <Card
          variant="tinted"
          onPress={() => navigation.navigate('Contacts')}
          style={styles.flex}
          accessibilityLabel="Emergency and important contacts"
        >
          <Icon icon={PhoneCall} color="danger" />
          <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
            Helplines
          </Text>
          <Text variant="small" color="muted">
            Police, fire, hospital & RWA office
          </Text>
        </Card>
        <Card
          variant="tinted"
          onPress={() => navigation.navigate('About')}
          style={styles.flex}
          accessibilityLabel="About D Block RWA"
        >
          <Icon icon={ShieldCheck} color="primary" />
          <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
            About us
          </Text>
          <Text variant="small" color="muted">
            Our society, office hours & contact
          </Text>
        </Card>
      </Appear>

      <Appear index={5} style={{ paddingHorizontal: theme.gutter }}>
        <Card variant="accent">
          <Text variant="h3">Live in D Block?</Text>
          <Text color="muted" style={{ marginVertical: theme.spacing.sm }}>
            Sign in with your registered mobile number to RSVP for events, raise
            complaints, vote in polls and see residents-only albums.
          </Text>
          <Button
            title="Resident sign in"
            icon={LogIn}
            onPress={() => navigation.navigate('Login')}
          />
        </Card>
      </Appear>
    </>
  );
}

// ---- Shared sections -----------------------------------------------------------------
function EventsCarousel({
  b,
  index,
  withRsvp,
}: {
  b: Bootstrap;
  index: number;
  withRsvp?: boolean;
}) {
  const navigation = useNavigation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const events = useMemo(() => upcomingEvents(b).slice(0, 8), [b]);
  const tileW = Math.min(width * 0.74, 320);
  return (
    <Appear index={index}>
      <View style={{ paddingHorizontal: theme.gutter }}>
        <SectionHeader
          overline="Coming up"
          title="Events & celebrations"
          actionLabel="See all"
          onAction={() => navigation.navigate('Tabs', { screen: 'Events' })}
        />
      </View>
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming events"
          message="New events will appear here."
        />
      ) : (
        <FlatList
          horizontal
          data={events}
          keyExtractor={e => e.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={tileW + theme.spacing.md}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: theme.gutter,
            gap: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
          }}
          renderItem={({ item }) => (
            <EventTile
              event={item}
              width={tileW}
              myStatus={
                withRsvp ? myRegistration(b, item.id)?.status : undefined
              }
              onPress={() =>
                navigation.navigate('EventDetail', { id: item.id })
              }
            />
          )}
        />
      )}
    </Appear>
  );
}

function NoticesSection({ b, index }: { b: Bootstrap; index: number }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const notices = useMemo(() => activeAnnouncements(b).slice(0, 3), [b]);
  if (notices.length === 0) return null;
  return (
    <Appear index={index} style={{ paddingHorizontal: theme.gutter }}>
      <SectionHeader
        overline="Notice board"
        title="Latest announcements"
        actionLabel="All notices"
        onAction={() => navigation.navigate('Tabs', { screen: 'Notices' })}
      />
      <View style={{ gap: theme.spacing.md }}>
        {notices.map(n => (
          <AnnouncementCard
            key={n.id}
            item={n}
            compact
            onPress={() =>
              navigation.navigate('AnnouncementDetail', { id: n.id })
            }
          />
        ))}
      </View>
    </Appear>
  );
}

function AlbumsCarousel({ b, index }: { b: Bootstrap; index: number }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const albums = useMemo(
    () => [...b.albums].sort((a, c) => c.year - a.year).slice(0, 8),
    [b],
  );
  if (albums.length === 0) return null;
  const w = 168;
  return (
    <Appear index={index}>
      <View style={{ paddingHorizontal: theme.gutter }}>
        <SectionHeader
          overline="Memories"
          title="Photo albums"
          actionLabel="Gallery"
          onAction={() => navigation.navigate('Tabs', { screen: 'Gallery' })}
        />
      </View>
      <FlatList
        horizontal
        data={albums}
        keyExtractor={a => a.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={w + theme.spacing.md}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: theme.gutter,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            width={w}
            cover={albumCover(b, item)}
            count={albumMedia(b, item.id).length}
            onPress={() =>
              navigation.navigate('AlbumDetail', { albumId: item.id })
            }
          />
        )}
      />
    </Appear>
  );
}

const styles = StyleSheet.create({
  noTopPad: { paddingTop: 0 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  section: {},
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  white: { color: '#FFFFFF' },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  quickGrid: { flexDirection: 'row' },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    minHeight: 92,
    justifyContent: 'center',
  },
  quickIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontWeight: '600' },
  adminIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatars: { flexDirection: 'row' },
  member: { alignItems: 'center' },
  memberName: { minHeight: 60 },
  overlap: { marginLeft: -12 },
  avatarRing: { borderWidth: 3, borderRadius: 30 },
  twoUp: { flexDirection: 'row' },
});
