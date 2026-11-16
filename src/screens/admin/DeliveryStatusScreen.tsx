import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  BellRing,
  CircleAlert,
  CircleCheck,
  Clock,
  MessageSquareText,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  SectionHeader,
  SkeletonList,
  StatTile,
  Text,
  type Tone,
} from '@/components';
import { data as dataService, toApiError, type ApiError } from '@/services';
import { useTheme } from '@/theme';
import type { SmsLog, SmsStatus } from '@/types/models';
import { formatDateTime, timeAgo } from '@/utils/date';
import { AdminScreen } from './components';

const TONE: Record<SmsStatus, Tone> = {
  Sent: 'success',
  Pending: 'warning',
  Failed: 'danger',
};
const ICON = {
  Sent: CircleCheck,
  Pending: Clock,
  Failed: CircleAlert,
} as const;

export function DeliveryStatusScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const q = useQuery<SmsLog[], ApiError>({
    queryKey: ['smsLog'],
    queryFn: async () => {
      try {
        return await dataService.getSmsLog();
      } catch (e) {
        throw toApiError(e);
      }
    },
  });
  const rows = q.data ?? [];
  const count = (s: SmsStatus) => rows.filter(r => r.status === s).length;
  const cols = width >= 720 ? 3 : width >= 380 ? 3 : 2;
  const tileWidth =
    (Math.min(width, 1000) - theme.gutter * 2 - theme.spacing.md * (cols - 1)) /
    cols;

  return (
    <AdminScreen
      title="Delivery status"
      permission="settings.manage"
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    >
      <View>
        <SectionHeader title="SMS" overline="Last 24 hours" />
        {q.isLoading ? (
          <SkeletonList count={3} height={72} />
        ) : q.error ? (
          <ErrorState message={q.error.message} onRetry={() => q.refetch()} />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            <View style={[styles.grid, { gap: theme.spacing.md }]}>
              {(['Sent', 'Pending', 'Failed'] as SmsStatus[]).map((s, i) => (
                <Appear key={s} index={i} style={{ width: tileWidth }}>
                  <StatTile
                    label={s}
                    value={count(s)}
                    icon={ICON[s]}
                    tone={TONE[s]}
                  />
                </Appear>
              ))}
            </View>
            {rows.length === 0 ? (
              <EmptyState icon={MessageSquareText} title="No messages yet" />
            ) : (
              rows.map((r, i) => (
                <Appear key={r.id} index={i + 3}>
                  <Card
                    padding="sm"
                    accessibilityLabel={`${r.purpose} to ${r.mobile}, ${
                      r.status
                    }${r.error ? `, ${r.error}` : ''}`}
                  >
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.icon,
                          {
                            backgroundColor: theme.colors.primarySoft,
                            borderRadius: theme.radius.md,
                          },
                        ]}
                      >
                        <Icon icon={MessageSquareText} color="primary" />
                      </View>
                      <View style={styles.flex}>
                        <Text variant="bodyStrong">{r.purpose}</Text>
                        <Text variant="caption" color="muted">
                          {r.mobile} · {timeAgo(r.createdAt)}
                          {r.sentAt
                            ? ` · sent ${formatDateTime(r.sentAt)}`
                            : ''}
                        </Text>
                        {r.error ? (
                          <Text variant="caption" color="danger">
                            {r.error}
                          </Text>
                        ) : null}
                      </View>
                      <Badge
                        label={r.status}
                        tone={TONE[r.status]}
                        icon={ICON[r.status]}
                      />
                    </View>
                  </Card>
                </Appear>
              ))
            )}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Push notifications" />
        <Card variant="tinted">
          <View style={styles.row}>
            <Icon icon={BellRing} color="muted" />
            <Text color="muted" style={styles.flex}>
              The push delivery log arrives with Phase 3 (API-GAPS §6.3):
              Expo/FCM receipts, invalid-token clean-up and per-category
              opt-outs.
            </Text>
          </View>
        </Card>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 2 },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
