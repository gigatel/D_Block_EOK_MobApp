import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Paperclip, Pin } from 'lucide-react-native';
import { Badge, Card, Icon, Text, toneColors } from '@/components';
import { useTheme } from '@/theme';
import type { Announcement } from '@/types/models';
import { timeAgo } from '@/utils/date';
import { NOTICE_ICON, NOTICE_TONE } from './icons';

export function AnnouncementCard({
  item,
  onPress,
  compact,
}: {
  item: Announcement;
  onPress: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  const tone = toneColors(NOTICE_TONE[item.category], theme.colors);
  return (
    <Card
      onPress={onPress}
      variant={item.pinned ? 'accent' : 'elevated'}
      accessibilityLabel={`${item.pinned ? 'Pinned. ' : ''}${item.category}: ${
        item.title
      }, ${timeAgo(item.publishedAt)}`}
    >
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <View
          style={[
            styles.icon,
            { backgroundColor: tone.bg, borderRadius: theme.radius.md },
          ]}
        >
          <Icon icon={NOTICE_ICON[item.category]} size={20} color={tone.fg} />
        </View>
        <View style={styles.flex}>
          <View style={styles.metaRow}>
            <Badge label={item.category} tone={NOTICE_TONE[item.category]} />
            {item.pinned ? (
              <Badge label="Pinned" tone="accent" icon={Pin} />
            ) : null}
            {item.visibility === 'Residents' ? (
              <Badge label="Residents" tone="neutral" />
            ) : null}
          </View>
          <Text variant="title" numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          {!compact ? (
            <Text variant="small" color="muted" numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <Text
              variant="caption"
              color="muted"
              numberOfLines={1}
              style={styles.flex}
            >
              {item.author} · {timeAgo(item.publishedAt)}
            </Text>
            {item.attachmentName ? (
              <Icon icon={Paperclip} size={14} color="muted" />
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  icon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  title: { marginTop: 6, marginBottom: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
});
