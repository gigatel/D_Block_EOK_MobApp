import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarDays,
  Clock,
  Home,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Appear,
  Card,
  Header,
  Icon,
  ListItem,
  Screen,
  SectionHeader,
  StatTile,
  Text,
  ThemeHero,
} from '@/components';
import { useBootstrap } from '@/features/data';
import { useTheme } from '@/theme';
import { callNumber, mailTo } from '@/utils/links';
import { QueryBoundary } from './components/QueryBoundary';

const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Safe & secure',
    text: 'Guards at every gate, CCTV coverage and verified domestic staff.',
  },
  {
    icon: Leaf,
    title: 'Green & clean',
    text: 'A well-kept central park, walking track and regular sanitation drives.',
  },
  {
    icon: HeartHandshake,
    title: 'Together as one',
    text: 'Festivals, health camps and sports that bring every family together.',
  },
];

export function AboutScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const q = useBootstrap();
  return (
    <Screen
      header={<Header title="About D Block" />}
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
    >
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {b => (
          <>
            <Appear
              index={0}
              style={[styles.heroWrap, { borderRadius: theme.radius.lg }]}
            >
              <ThemeHero
                compact
                title={b.settings.siteName}
                subtitle={b.settings.tagline}
                eyebrow="Since 1970s · New Delhi"
              />
            </Appear>

            <Appear index={1} style={{ gap: theme.spacing.sm }}>
              <Text variant="h3">Who we are</Text>
              <Text color="muted">
                The D Block Residents Welfare Association represents every
                family living in D Block, East of Kailash. Our elected committee
                looks after security, sanitation, the parks, utilities and the
                community calendar — and is the residents’ voice with the MCD,
                DJB, BSES and Delhi Police.
              </Text>
            </Appear>

            {b.residents.length || b.properties.length ? (
              <Appear
                index={2}
                style={[styles.stats, { gap: theme.spacing.md }]}
              >
                {b.properties.length ? (
                  <StatTile
                    label="Homes"
                    value={b.properties.length}
                    icon={Home}
                  />
                ) : null}
                {b.residents.length ? (
                  <StatTile
                    label="Residents"
                    value={b.residents.length}
                    icon={Users}
                    tone="accent"
                  />
                ) : null}
                <StatTile
                  label="Events"
                  value={b.events.length}
                  icon={CalendarDays}
                  tone="success"
                />
              </Appear>
            ) : (
              <Appear
                index={2}
                style={[styles.stats, { gap: theme.spacing.md }]}
              >
                <StatTile
                  label="Events this year"
                  value={b.events.length}
                  icon={CalendarDays}
                  tone="success"
                />
                <StatTile
                  label="Committee members"
                  value={b.committee.length}
                  icon={Users}
                  tone="accent"
                  onPress={() => navigation.navigate('Committee')}
                />
              </Appear>
            )}

            <Appear index={3} style={{ gap: theme.spacing.md }}>
              {VALUES.map(v => (
                <Card key={v.title} variant="tinted">
                  <View style={[styles.valueRow, { gap: theme.spacing.md }]}>
                    <View
                      style={[
                        styles.valueIcon,
                        {
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <Icon icon={v.icon} color="primary" />
                    </View>
                    <View style={styles.flex}>
                      <Text variant="title">{v.title}</Text>
                      <Text variant="small" color="muted">
                        {v.text}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </Appear>

            <Appear index={4}>
              <SectionHeader title="RWA office" overline="Visit or call" />
              <Card padding="sm">
                <ListItem
                  icon={MapPin}
                  title={b.settings.address}
                  subtitle="Address"
                />
                <ListItem
                  icon={Clock}
                  title={b.settings.officeHours}
                  subtitle="Office hours"
                />
                <ListItem
                  icon={Phone}
                  title={b.settings.phone}
                  subtitle="Tap to call"
                  onPress={() => callNumber(b.settings.phone)}
                  accessibilityHint="Opens the phone dialer"
                />
                <ListItem
                  icon={Mail}
                  title={b.settings.email}
                  subtitle="Tap to email"
                  onPress={() => mailTo(b.settings.email)}
                />
                {b.settings.whatsappGroupInfo ? (
                  <ListItem
                    icon={MessageCircle}
                    title="WhatsApp group"
                    subtitle={b.settings.whatsappGroupInfo}
                  />
                ) : null}
              </Card>
            </Appear>

            <Appear index={5}>
              <Card
                onPress={() => navigation.navigate('Committee')}
                variant="accent"
              >
                <ListItem
                  icon={Users}
                  title="Meet the managing committee"
                  subtitle={`${b.committee.length} elected members`}
                  chevron
                />
              </Card>
            </Appear>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: { overflow: 'hidden' },
  stats: { flexDirection: 'row', flexWrap: 'wrap' },
  valueRow: { flexDirection: 'row', alignItems: 'center' },
  valueIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
