import React, { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import {
  Building2,
  Phone,
  PhoneCall,
  Siren,
  Stethoscope,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  Header,
  Icon,
  PressableScale,
  Screen,
  Text,
  toneColors,
  type Tone,
} from '@/components';
import { useBootstrap } from '@/features/data';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTheme } from '@/theme';
import {
  CONTACT_CATEGORIES,
  type ContactCategory,
  type ImportantContact,
} from '@/types/models';
import { callNumber } from '@/utils/links';
import { QueryBoundary } from './components/QueryBoundary';
import { listScreenContent, useListPadding } from './components/useListPadding';

const META: Record<ContactCategory, { icon: LucideIcon; tone: Tone }> = {
  Emergency: { icon: Siren, tone: 'danger' },
  'RWA Office': { icon: Building2, tone: 'primary' },
  Utilities: { icon: Zap, tone: 'warning' },
  Medical: { icon: Stethoscope, tone: 'info' },
  Services: { icon: Wrench, tone: 'accent' },
};

export function ContactsScreen() {
  const theme = useTheme();
  const q = useBootstrap();
  const pull = usePullToRefresh(q.isRefetching);
  const pad = useListPadding();
  const sections = useMemo(
    () =>
      CONTACT_CATEGORIES.map(cat => ({
        title: cat,
        data: (q.data?.contacts ?? [])
          .filter(c => c.category === cat)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      })).filter(s => s.data.length),
    [q.data],
  );

  return (
    <Screen
      scroll={false}
      bleed
      header={<Header title="Important contacts" />}
      contentStyle={listScreenContent}
    >
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {() => (
          <SectionList
            sections={sections}
            keyExtractor={c => c.id}
            contentContainerStyle={pad}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={pull.refreshing}
                onRefresh={() => {
                  pull.start();
                  q.refetch();
                }}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState icon={PhoneCall} title="No contacts yet" />
            }
            renderSectionHeader={({ section }) => {
              const meta = META[section.title];
              return (
                <View
                  style={[styles.sectionHead, { marginTop: theme.spacing.md }]}
                >
                  <Icon
                    icon={meta.icon}
                    size={18}
                    color={toneColors(meta.tone, theme.colors).fg}
                  />
                  <Text variant="h3" accessibilityRole="header">
                    {section.title}
                  </Text>
                </View>
              );
            }}
            renderItem={({ item }) => <ContactRow c={item} />}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

function ContactRow({ c }: { c: ImportantContact }) {
  const theme = useTheme();
  const meta = META[c.category];
  const tone = toneColors(meta.tone, theme.colors);
  const emergency = c.category === 'Emergency';
  return (
    <Card
      padding="sm"
      variant={emergency ? 'outlined' : 'elevated'}
      style={
        emergency
          ? [styles.emergency, { borderColor: theme.colors.danger }]
          : undefined
      }
    >
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: tone.bg, borderRadius: theme.radius.md },
          ]}
        >
          <Icon icon={meta.icon} size={20} color={tone.fg} />
        </View>
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {c.name}
          </Text>
          <Text
            variant={emergency ? 'title' : 'small'}
            color={emergency ? 'danger' : 'muted'}
          >
            {c.phone}
            {c.notes ? (
              <Text variant="small" color="muted">{`  ·  ${c.notes}`}</Text>
            ) : null}
          </Text>
        </View>
        <PressableScale
          onPress={() => callNumber(c.phone)}
          accessibilityLabel={`Call ${c.name}, ${c.phone}`}
          accessibilityHint="Opens the phone dialer"
          style={[
            styles.call,
            {
              width: theme.touchTarget,
              height: theme.touchTarget,
              backgroundColor: emergency
                ? theme.colors.danger
                : theme.colors.primary,
            },
          ]}
        >
          <Icon icon={Phone} size={20} color="onPrimary" />
        </PressableScale>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  emergency: { borderLeftWidth: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  call: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
