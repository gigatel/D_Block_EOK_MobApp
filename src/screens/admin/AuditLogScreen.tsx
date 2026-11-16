import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CalendarDays,
  FileText,
  Images,
  Megaphone,
  MessageSquareWarning,
  Palette,
  ScrollText,
  Search,
  UserRound,
  Vote,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Appear,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  SkeletonList,
  Text,
} from '@/components';
import { useBootstrap } from '@/features/data';
import { useDebounce } from '@/hooks/useDebounce';
import { useTheme } from '@/theme';
import type { AuditLog } from '@/types/models';
import { formatDateLong, formatTime, istParts } from '@/utils/date';
import { AdminScreen } from './components';

function entityIcon(entity: string): LucideIcon {
  const e = entity.toLowerCase();
  if (e.includes('complaint')) return MessageSquareWarning;
  if (e.includes('announcement')) return Megaphone;
  if (e.includes('event') || e.includes('registration')) return CalendarDays;
  if (e.includes('media') || e.includes('album')) return Images;
  if (e.includes('theme')) return Palette;
  if (e.includes('poll')) return Vote;
  if (e.includes('resident') || e.includes('user')) return UserRound;
  return FileText;
}

const dayKey = (iso: string) => {
  const p = istParts(iso);
  return `${p.year}-${p.month}-${p.day}`;
};

export function AuditLogScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useBootstrap();
  const [query, setQuery] = useState('');
  const q = useDebounce(query.trim().toLowerCase(), 200);

  const groups = useMemo(() => {
    const rows = [...(data?.audit ?? [])]
      .filter(
        a =>
          !q ||
          [a.actor, a.entity, a.action, a.details ?? '', a.entityId ?? ''].some(
            f => f.toLowerCase().includes(q),
          ),
      )
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const out: { key: string; label: string; items: AuditLog[] }[] = [];
    for (const r of rows) {
      const k = dayKey(r.at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(r);
      else out.push({ key: k, label: formatDateLong(r.at), items: [r] });
    }
    return out;
  }, [data, q]);

  return (
    <AdminScreen title="Audit log" permission="audit.view">
      <Input
        label="Search"
        icon={Search}
        value={query}
        onChangeText={setQuery}
        placeholder="Actor, entity or action"
        autoCapitalize="none"
        returnKeyType="search"
      />
      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={q ? 'No matches' : 'No activity yet'}
          message={q ? 'Try a different search.' : undefined}
        />
      ) : (
        groups.map((g, gi) => (
          <Appear key={g.key} index={gi} style={{ gap: theme.spacing.sm }}>
            <Text variant="overline" color="muted" accessibilityRole="header">
              {g.label}
            </Text>
            <Card padding="sm">
              {g.items.map((a, i) => (
                <View
                  key={a.id}
                  accessible
                  accessibilityLabel={`${formatTime(a.at)}, ${a.actor} ${
                    a.action
                  } ${a.entity}${a.details ? `, ${a.details}` : ''}`}
                  style={[
                    styles.row,
                    i > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: theme.colors.primarySoft,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <Icon
                      icon={entityIcon(a.entity)}
                      size={18}
                      color="primary"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">
                      {a.actor}{' '}
                      <Text color="muted">{a.action.toLowerCase()}</Text>{' '}
                      {a.entity}
                    </Text>
                    {a.details ? (
                      <Text variant="small" color="muted">
                        {a.details}
                      </Text>
                    ) : null}
                    <Text variant="caption" color="muted">
                      {formatTime(a.at)}
                      {a.entityId ? ` · ${a.entityId}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Appear>
        ))
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  flex: { flex: 1, gap: 2 },
  icon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
