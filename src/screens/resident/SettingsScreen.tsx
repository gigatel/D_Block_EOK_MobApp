import React from 'react';
import {
  CalendarDays,
  Database,
  Server,
  Info,
  LogOut,
  Megaphone,
  Palette,
  Smartphone,
  Vibrate,
  Vote,
  Wrench,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Header,
  ListItem,
  Screen,
  SegmentedControl,
  SwitchRow,
  Text,
} from '@/components';
import { apiHost, env } from '@/config/env';
import { useServerHealth } from '@/features/data';
import { signOut } from '@/services/auth';
import { showAlert } from '@/store/alert';
import { usePrefs, type MotionPref } from '@/store/prefs';
import { useIsSignedIn } from '@/store/session';
import { useTheme, useThemeState } from '@/theme';
import { Section } from './components/Section';

export function SettingsScreen() {
  const theme = useTheme();
  const { reduceMotion } = useThemeState();
  const signedIn = useIsSignedIn();
  const { haptics, setHaptics, motion, setMotion, push, setPush } = usePrefs();
  const health = useServerHealth();
  const serverOk = health.data?.status?.toLowerCase() === 'healthy';

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
    <Screen header={<Header title="Settings" />}>
      <Appear index={0}>
        <Section title="Feel">
          <SwitchRow
            icon={Vibrate}
            title="Haptic feedback"
            subtitle="Gentle vibrations on taps and actions"
            value={haptics}
            onChange={setHaptics}
          />
        </Section>
      </Appear>

      <Appear index={1} style={{ gap: theme.spacing.sm }}>
        <Text variant="overline" color="muted" accessibilityRole="header">
          Motion
        </Text>
        <SegmentedControl<MotionPref>
          options={['system', 'reduced', 'full']}
          labels={{ system: 'System', reduced: 'Reduced', full: 'Full' }}
          value={motion}
          onChange={setMotion}
        />
        <Text variant="caption" color="muted">
          {reduceMotion
            ? 'Animations and festive decorations are reduced.'
            : 'Animations and festive decorations are on.'}
        </Text>
      </Appear>

      {signedIn ? (
        <Appear index={2}>
          <Section
            title="Push notifications"
            footer="Push notifications arrive in Phase 3. In-app notifications already work."
          >
            <SwitchRow
              icon={Megaphone}
              title="Notices & circulars"
              value={push.announcements}
              onChange={v => setPush('announcements', v)}
            />
            <SwitchRow
              icon={CalendarDays}
              title="Events & reminders"
              value={push.events}
              onChange={v => setPush('events', v)}
            />
            <SwitchRow
              icon={Wrench}
              title="My complaints"
              value={push.complaints}
              onChange={v => setPush('complaints', v)}
            />
            <SwitchRow
              icon={Vote}
              title="Polls"
              value={push.polls}
              onChange={v => setPush('polls', v)}
            />
            <SwitchRow
              icon={Palette}
              title="Festival themes"
              value={push.theme}
              onChange={v => setPush('theme', v)}
            />
          </Section>
        </Appear>
      ) : null}

      <Appear index={3}>
        <Section title="About this app">
          <ListItem
            icon={Database}
            title="Data source"
            subtitle={
              env.DATA_MODE === 'mock'
                ? 'Demo data (offline prototype)'
                : env.DATA_MODE === 'hybrid'
                ? `Live — ${apiHost}, demo data for the rest`
                : `Live — ${apiHost}`
            }
          />
          {env.DATA_MODE !== 'mock' ? (
            <ListItem
              icon={Server}
              title="Server status"
              subtitle={
                health.isPending
                  ? 'Checking…'
                  : serverOk
                  ? 'Connected'
                  : 'Can’t reach the server — check Wi-Fi'
              }
              onPress={() => health.refetch()}
              chevron={false}
              right={
                health.isPending ? undefined : (
                  <Badge
                    label={serverOk ? 'Online' : 'Offline'}
                    tone={serverOk ? 'success' : 'danger'}
                  />
                )
              }
            />
          ) : null}
          <ListItem
            icon={Smartphone}
            title="Version"
            subtitle="0.1.0 · Phase 1 prototype"
          />
          <ListItem
            icon={Info}
            title="Theme"
            subtitle={`${theme.name} · ${theme.resolution.reason}`}
          />
        </Section>
      </Appear>

      {signedIn ? (
        <Appear index={4}>
          <Section>
            <ListItem
              icon={LogOut}
              title="Sign out"
              destructive
              chevron={false}
              onPress={confirmSignOut}
            />
          </Section>
        </Appear>
      ) : null}
    </Screen>
  );
}
