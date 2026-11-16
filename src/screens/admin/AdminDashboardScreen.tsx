import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Images,
  Megaphone,
  MessageSquareWarning,
  Palette,
  ScrollText,
  Send,
  Sparkles,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Card,
  DateBadge,
  ErrorState,
  Icon,
  ListItem,
  PressableScale,
  SectionHeader,
  SkeletonList,
  StatTile,
  Text,
} from '@/components';
import {
  complaintCounts,
  unreadCount,
  upcomingEvents,
  useBootstrap,
} from '@/features/data';
import { useSession } from '@/store/session';
import {
  useReduceMotion,
  useTheme,
  useThemeState,
  type AppColors,
} from '@/theme';
import type { ComplaintStatus, Permission } from '@/types/models';
import { formatDateTime, partOfDay, timeAgo } from '@/utils/date';
import { AdminScreen } from './components';
import type { RootStackParamList } from '@/navigation/types';

type Module = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  route: keyof RootStackParamList;
  perms: Permission[];
};

const MODULES: Module[] = [
  {
    title: 'Announcements',
    subtitle: 'Notices & circulars',
    icon: Megaphone,
    route: 'AdminAnnouncements',
    perms: ['announcements.manage'],
  },
  {
    title: 'Events',
    subtitle: 'Celebrations & RSVPs',
    icon: CalendarDays,
    route: 'AdminEvents',
    perms: ['events.manage'],
  },
  {
    title: 'Albums & uploads',
    subtitle: 'Photos & videos',
    icon: Images,
    route: 'AdminAlbums',
    perms: ['albums.manage', 'media.upload'],
  },
  {
    title: 'Complaints',
    subtitle: 'Assign & resolve',
    icon: MessageSquareWarning,
    route: 'AdminComplaints',
    perms: ['complaints.manage'],
  },
  {
    title: 'Themes',
    subtitle: 'Festivals & schedules',
    icon: Palette,
    route: 'ThemeStudio',
    perms: ['themes.manage'],
  },
  {
    title: 'Delivery status',
    subtitle: 'SMS & push log',
    icon: Send,
    route: 'DeliveryStatus',
    perms: ['settings.manage'],
  },
  {
    title: 'Audit log',
    subtitle: 'Who changed what',
    icon: ScrollText,
    route: 'AuditLog',
    perms: ['audit.view'],
  },
];

const STATUS_COLOR: Record<ComplaintStatus, keyof AppColors> = {
  Open: 'info',
  'In Progress': 'warning',
  Resolved: 'success',
  Closed: 'muted',
};

function Segment({ share, color }: { share: number; color: string }) {
  const reduce = useReduceMotion();
  const pct = share * 100;
  const style = useAnimatedStyle(() => ({
    width: reduce ? `${pct}%` : withTiming(`${pct}%`, { duration: 700 }),
  }));
  return (
    <Animated.View
      style={[{ height: '100%', backgroundColor: color }, style]}
    />
  );
}

function ComplaintsBar({
  counts,
}: {
  counts: Record<ComplaintStatus, number>;
}) {
  const theme = useTheme();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const statuses = Object.keys(counts) as ComplaintStatus[];
  return (
    <Card
      accessibilityLabel={`Complaints by status: ${statuses
        .map(s => `${counts[s]} ${s}`)
        .join(', ')}`}
    >
      <View style={styles.rowBetween}>
        <Text variant="title">Complaints by status</Text>
        <Text variant="small" color="muted">
          {total} total
        </Text>
      </View>
      <View
        style={[
          styles.bar,
          {
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceAlt,
            marginVertical: theme.spacing.md,
          },
        ]}
      >
        {total > 0
          ? statuses.map(s => (
              <Segment
                key={s}
                share={counts[s] / total}
                color={theme.colors[STATUS_COLOR[s]]}
              />
            ))
          : null}
      </View>
      <View style={styles.legend}>
        {statuses.map(s => (
          <View key={s} style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors[STATUS_COLOR[s]] },
              ]}
            />
            <Text variant="small">
              {s}{' '}
              <Text variant="small" color="muted">
                · {counts[s]}
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function AdminDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const user = useSession(s => s.user);
  const perms = user?.permissions ?? [];
  const { theme: active } = useThemeState();
  const { data, isLoading, error, refetch } = useBootstrap();

  const cols = width >= 720 ? 3 : 2;
  const tileWidth =
    (Math.min(width, 1000) - theme.gutter * 2 - theme.spacing.md * (cols - 1)) /
    cols;
  const firstName = user?.name.split(' ')[0] ?? '';

  let body: React.ReactNode;
  if (isLoading) {
    body = <SkeletonList count={4} />;
  } else if (error || !data) {
    body = (
      <ErrorState
        message={error?.message ?? 'Could not load data.'}
        onRetry={() => refetch()}
      />
    );
  } else {
    const counts = complaintCounts(data);
    const upcoming = upcomingEvents(data).slice(0, 3);
    const stats: {
      label: string;
      value: number;
      icon: LucideIcon;
      tone: 'info' | 'warning' | 'primary' | 'accent' | 'success' | 'danger';
      route?: keyof RootStackParamList;
    }[] = [
      {
        label: 'Open complaints',
        value: counts.Open,
        icon: ClipboardList,
        tone: 'info',
        route: 'AdminComplaints',
      },
      {
        label: 'In progress',
        value: counts['In Progress'],
        icon: Timer,
        tone: 'warning',
        route: 'AdminComplaints',
      },
      {
        label: 'Upcoming events',
        value: upcomingEvents(data).length,
        icon: CalendarDays,
        tone: 'primary',
        route: 'AdminEvents',
      },
      {
        label: 'Residents',
        value: data.residents.length,
        icon: Users,
        tone: 'success',
      },
      {
        label: 'Albums',
        value: data.albums.length,
        icon: Images,
        tone: 'accent',
        route: 'AdminAlbums',
      },
      {
        label: 'Unread notifications',
        value: unreadCount(data),
        icon: Bell,
        tone: 'danger',
      },
    ];
    const modules = MODULES.filter(m => m.perms.some(p => perms.includes(p)));
    body = (
      <>
        <Appear index={1}>
          <Card
            variant="accent"
            onPress={
              perms.includes('themes.manage')
                ? () => navigation.navigate('ThemeStudio')
                : undefined
            }
            accessibilityLabel={`Active theme ${active.name}. ${active.resolution.reason}`}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.themeIcon,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Icon icon={Sparkles} color="onPrimary" />
              </View>
              <View style={styles.flex}>
                <Text variant="overline" color="muted">
                  Active theme
                </Text>
                <Text variant="title">{active.name}</Text>
                <Text variant="small" color="muted">
                  {active.resolution.reason}
                </Text>
              </View>
              {perms.includes('themes.manage') ? (
                <Icon icon={ChevronRight} color="muted" />
              ) : null}
            </View>
          </Card>
        </Appear>

        <View style={[styles.grid, { gap: theme.spacing.md }]}>
          {stats.map((s, i) => (
            <Appear key={s.label} index={i + 2} style={{ width: tileWidth }}>
              <StatTile
                label={s.label}
                value={s.value}
                icon={s.icon}
                tone={s.tone}
                onPress={
                  s.route &&
                  MODULES.find(m => m.route === s.route)?.perms.some(p =>
                    perms.includes(p),
                  )
                    ? () => navigation.navigate(s.route as never)
                    : undefined
                }
              />
            </Appear>
          ))}
        </View>

        <Appear index={4}>
          <ComplaintsBar counts={counts} />
        </Appear>

        {modules.length ? (
          <View>
            <SectionHeader title="Manage" overline="Committee tools" />
            <View style={[styles.grid, { gap: theme.spacing.md }]}>
              {modules.map((m, i) => (
                <Appear
                  key={m.route}
                  index={i + 5}
                  style={{ width: tileWidth }}
                >
                  <PressableScale
                    onPress={() => navigation.navigate(m.route as never)}
                    accessibilityLabel={`${m.title}. ${m.subtitle}`}
                    style={[
                      styles.module,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.lg,
                        padding: theme.spacing.lg,
                      },
                      theme.shadow.card,
                    ]}
                  >
                    <View
                      style={[
                        styles.moduleIcon,
                        {
                          backgroundColor: theme.colors.primarySoft,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <Icon icon={m.icon} color="primary" />
                    </View>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {m.subtitle}
                    </Text>
                  </PressableScale>
                </Appear>
              ))}
            </View>
          </View>
        ) : null}

        <View>
          <SectionHeader
            title="Upcoming events"
            actionLabel={perms.includes('events.manage') ? 'Manage' : undefined}
            onAction={() => navigation.navigate('AdminEvents')}
          />
          <Card padding="sm">
            {upcoming.length ? (
              upcoming.map(e => (
                <ListItem
                  key={e.id}
                  title={e.title}
                  subtitle={`${formatDateTime(e.startsAt)} · ${e.venue}`}
                  left={<DateBadge date={e.startsAt} variant="light" />}
                  onPress={() =>
                    navigation.navigate('EventDetail', { id: e.id })
                  }
                />
              ))
            ) : (
              <Text color="muted">No upcoming events.</Text>
            )}
          </Card>
        </View>

        {perms.includes('audit.view') && data.audit.length ? (
          <View>
            <SectionHeader
              title="Recent activity"
              actionLabel="Audit log"
              onAction={() => navigation.navigate('AuditLog')}
            />
            <Card padding="sm">
              {data.audit.slice(0, 5).map(a => (
                <ListItem
                  key={a.id}
                  icon={ScrollText}
                  title={`${a.actor} · ${a.action} ${a.entity}`}
                  subtitle={[a.details, timeAgo(a.at)]
                    .filter(Boolean)
                    .join(' · ')}
                />
              ))}
            </Card>
          </View>
        ) : null}
      </>
    );
  }

  return (
    <AdminScreen title="Committee dashboard" permission="dashboard.view">
      <Appear index={0}>
        <Text variant="overline" color="accent">
          {user?.roles.filter(r => r !== 'Resident').join(' · ') || 'Committee'}
        </Text>
        <Text variant="h1" accessibilityRole="header">
          Good {partOfDay()}, {firstName}
        </Text>
        <View style={styles.marginTop6}>
          <Badge label={`${perms.length} permissions`} tone="primary" />
        </View>
      </Appear>
      {body}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  marginTop6: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  bar: { height: 14, flexDirection: 'row', overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  themeIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  module: { borderWidth: 1, gap: 4, minHeight: 120 },
  moduleIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
