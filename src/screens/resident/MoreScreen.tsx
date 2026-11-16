import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  BookUser,
  Building2,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Palette,
  Phone,
  Settings,
  SwatchBook,
  UserRound,
  Users,
  Vote,
  Wrench,
} from 'lucide-react-native';
import {
  Appear,
  Avatar,
  Badge,
  Button,
  Card,
  DemoBadge,
  Header,
  ListItem,
  Screen,
  Text,
} from '@/components';
import { env } from '@/config/env';
import {
  flatOf,
  me,
  residentName,
  unreadCount,
  useBootstrap,
} from '@/features/data';
import { signOut } from '@/services/auth';
import { showAlert } from '@/store/alert';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import { Section } from './components/Section';

const APP_VERSION = '0.1.0 (Phase 1 prototype)';

export function MoreScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const user = useSession(s => s.user);
  const { data, refetch, isRefetching } = useBootstrap();
  const resident = data ? me(data) : undefined;
  const flat = data && user ? flatOf(data, user.residentId) : undefined;
  const unread = data ? unreadCount(data) : 0;
  const perms = user?.permissions ?? [];
  const isCommittee = perms.length > 0;
  const roleLabel = user?.roles.find(r => r !== 'Resident') ?? 'Resident';

  const confirmSignOut = () =>
    showAlert(
      'Sign out?',
      'You will need your mobile number to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', icon: LogOut, onPress: () => signOut() },
      ],
      { icon: LogOut },
    );

  return (
    <Screen
      header={<Header title="More" large back={false} right={<DemoBadge />} />}
      onRefresh={user ? refetch : undefined}
      refreshing={isRefetching}
    >
      {user ? (
        <Appear index={0}>
          <Card
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel={`${user.name}, view profile`}
            style={styles.profile}
          >
            <Avatar name={user.name} color={resident?.avatarColor} size={58} />
            <View style={styles.flex}>
              <Text variant="h3" numberOfLines={1}>
                {resident ? residentName(resident) : user.name}
              </Text>
              <Text variant="small" color="muted">
                {flat
                  ? `${flat.houseNo} · ${flat.floor} floor`
                  : 'D Block, East of Kailash'}
              </Text>
              <View style={[styles.badges, { marginTop: theme.spacing.xs }]}>
                <Badge
                  label={roleLabel}
                  tone={isCommittee ? 'accent' : 'primary'}
                />
                {resident ? <Badge label={resident.type} /> : null}
              </View>
            </View>
            <UserRound size={20} color={theme.colors.muted} />
          </Card>
        </Appear>
      ) : (
        <Appear index={0}>
          <Card variant="tinted" style={{ gap: theme.spacing.md }}>
            <Text variant="h3">Are you a D Block resident?</Text>
            <Text color="muted">
              Sign in with your registered mobile number to RSVP for events,
              raise complaints, vote in polls and view the resident directory.
            </Text>
            <Button
              title="Sign in"
              icon={LogIn}
              onPress={() => navigation.navigate('Login')}
            />
          </Card>
        </Appear>
      )}

      {user ? (
        <Appear index={1}>
          <Section title="My community">
            <ListItem
              icon={Bell}
              title="Notifications"
              subtitle={unread ? `${unread} unread` : 'You’re all caught up'}
              onPress={() => navigation.navigate('Notifications')}
              right={
                unread ? (
                  <Badge label={String(unread)} tone="danger" />
                ) : undefined
              }
            />
            <ListItem
              icon={Wrench}
              title="Complaints"
              subtitle="Raise and track service requests"
              onPress={() => navigation.navigate('Complaints')}
            />
            <ListItem
              icon={Vote}
              title="Polls & surveys"
              subtitle="Have your say"
              onPress={() => navigation.navigate('Polls')}
            />
            <ListItem
              icon={BookUser}
              title="Resident directory"
              subtitle="Neighbours who chose to be listed"
              onPress={() => navigation.navigate('Directory')}
            />
            <ListItem
              icon={Phone}
              title="Important contacts"
              subtitle="Emergency, utilities, services"
              onPress={() => navigation.navigate('Contacts')}
            />
          </Section>
        </Appear>
      ) : null}

      {isCommittee ? (
        <Appear index={2}>
          <Section title="Committee">
            <ListItem
              icon={LayoutDashboard}
              title="Admin dashboard"
              subtitle="Notices, events, albums, complaints"
              onPress={() => navigation.navigate('AdminDashboard')}
            />
            {perms.includes('themes.manage') ? (
              <ListItem
                icon={Palette}
                title="Theme studio"
                subtitle="Festival themes, schedules & preview"
                onPress={() => navigation.navigate('ThemeStudio')}
              />
            ) : null}
          </Section>
        </Appear>
      ) : null}

      <Appear index={3}>
        <Section title="About the RWA">
          <ListItem
            icon={Info}
            title="About D Block"
            onPress={() => navigation.navigate('About')}
          />
          <ListItem
            icon={Users}
            title="Committee"
            onPress={() => navigation.navigate('Committee')}
          />
          {!user ? (
            <ListItem
              icon={Phone}
              title="Important contacts"
              onPress={() => navigation.navigate('Contacts')}
            />
          ) : null}
        </Section>
      </Appear>

      <Appear index={4}>
        <Section title="App">
          <ListItem
            icon={Settings}
            title="Settings"
            subtitle="Notifications, motion, haptics"
            onPress={() => navigation.navigate('Settings')}
          />
          {env.SHOW_DEV_TOOLS ? (
            <ListItem
              icon={SwatchBook}
              title="Component gallery"
              subtitle="Developer tool"
              onPress={() => navigation.navigate('ComponentGallery')}
            />
          ) : null}
          {user ? (
            <ListItem
              icon={LogOut}
              title="Sign out"
              destructive
              chevron={false}
              onPress={confirmSignOut}
            />
          ) : null}
        </Section>
      </Appear>

      <View style={[styles.footer, { gap: theme.spacing.xs }]}>
        <Building2 size={18} color={theme.colors.muted} />
        <Text variant="caption" color="muted" align="center">
          D Block EOK Residents Welfare Association{'\n'}Version {APP_VERSION}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flex: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  footer: { alignItems: 'center', paddingTop: 8 },
});
