import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import {
  CalendarClock,
  FileText,
  Megaphone,
  Pin,
  UserRound,
} from 'lucide-react-native';
import {
  Appear,
  ArtCover,
  Badge,
  Card,
  EmptyState,
  Header,
  ListItem,
  Screen,
  Text,
} from '@/components';
import { useBootstrap } from '@/features/data';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme';
import { formatDate, formatDateTime } from '@/utils/date';
import { NOTICE_ICON, NOTICE_TONE } from './components/icons';
import { QueryBoundary } from './components/QueryBoundary';

export function AnnouncementDetailScreen() {
  const theme = useTheme();
  const { params } =
    useRoute<RouteProp<RootStackParamList, 'AnnouncementDetail'>>();
  const q = useBootstrap();
  const item = q.data?.announcements.find(a => a.id === params.id);

  return (
    <Screen
      header={<Header title="Notice" />}
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
    >
      <QueryBoundary
        data={q.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
      >
        {() =>
          !item ? (
            <EmptyState
              icon={Megaphone}
              title="Notice not found"
              message="It may have expired or is for residents only."
            />
          ) : (
            <>
              <Appear index={0}>
                <ArtCover
                  seed={item.id}
                  icon={NOTICE_ICON[item.category]}
                  radius={theme.radius.lg}
                  style={styles.art}
                />
              </Appear>
              <Appear index={1} style={{ gap: theme.spacing.sm }}>
                <View style={styles.badges}>
                  <Badge
                    label={item.category}
                    tone={NOTICE_TONE[item.category]}
                    icon={NOTICE_ICON[item.category]}
                  />
                  {item.pinned ? (
                    <Badge label="Pinned" tone="accent" icon={Pin} />
                  ) : null}
                  <Badge
                    label={
                      item.visibility === 'Public' ? 'Public' : 'Residents only'
                    }
                  />
                </View>
                <Text variant="h1" accessibilityRole="header">
                  {item.title}
                </Text>
              </Appear>
              <Appear index={2}>
                <Card variant="tinted" padding="sm">
                  <ListItem
                    icon={UserRound}
                    title={item.author}
                    subtitle="Posted by"
                  />
                  <ListItem
                    icon={CalendarClock}
                    title={formatDateTime(item.publishedAt)}
                    subtitle={
                      item.expiresAt
                        ? `Valid until ${formatDate(item.expiresAt)}`
                        : 'Published'
                    }
                  />
                </Card>
              </Appear>
              <Appear index={3}>
                <Text style={styles.body} selectable>
                  {item.body}
                </Text>
              </Appear>
              {item.attachmentName ? (
                <Appear index={4}>
                  <Card>
                    <ListItem
                      icon={FileText}
                      title={item.attachmentName}
                      subtitle="Attachment · downloads arrive with Phase 3"
                    />
                  </Card>
                </Appear>
              ) : null}
            </>
          )
        }
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { height: 150 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  body: { lineHeight: 26 },
});
