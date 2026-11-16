import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CircleCheck, Clock, Vote } from 'lucide-react-native';
import {
  Appear,
  Badge,
  Card,
  EmptyState,
  Header,
  Icon,
  ProgressBar,
  Screen,
  SectionHeader,
  Text,
} from '@/components';
import { isPollOpen, pollResults, useBootstrap } from '@/features/data';
import { useTheme } from '@/theme';
import type { Bootstrap } from '@/types/bootstrap';
import type { Poll } from '@/types/models';
import { formatDate, timeUntil } from '@/utils/date';
import { GatedScreen } from './components/GatedScreen';
import { QueryState } from './components/QueryState';

function PollCard({
  poll,
  data,
  index,
}: {
  poll: Poll;
  data: Bootstrap;
  index: number;
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const open = isPollOpen(poll);
  const r = pollResults(data, poll);
  const leader = [...r.options].sort((a, b) => b.votes - a.votes)[0];
  return (
    <Appear index={index}>
      <Card
        onPress={() => navigation.navigate('PollDetail', { id: poll.id })}
        accessibilityLabel={`${poll.question}. ${open ? 'Open' : 'Closed'}. ${
          r.total
        } votes`}
        style={{ gap: theme.spacing.sm }}
      >
        <View style={styles.row}>
          <Badge
            label={open ? 'Open' : 'Closed'}
            tone={open ? 'success' : 'neutral'}
            icon={open ? Clock : undefined}
          />
          {r.myOptionId ? (
            <Badge label="You voted" tone="primary" icon={CircleCheck} />
          ) : null}
        </View>
        <Text variant="title">{poll.question}</Text>
        {poll.description ? (
          <Text variant="small" color="muted" numberOfLines={2}>
            {poll.description}
          </Text>
        ) : null}
        {!open && leader ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="small" color="muted">
              Result: {leader.label} · {Math.round(leader.share * 100)}%
            </Text>
            <ProgressBar value={leader.share} color="accent" />
          </View>
        ) : null}
        <View style={styles.row}>
          <Icon icon={Vote} size={15} color="muted" />
          <Text variant="caption" color="muted">
            {poll.options.length} option{poll.options.length === 1 ? '' : 's'} ·{' '}
            {r.total} vote{r.total === 1 ? '' : 's'} ·{' '}
            {open
              ? `closes ${timeUntil(poll.closesAt)}`
              : `closed ${formatDate(poll.closesAt)}`}
          </Text>
        </View>
      </Card>
    </Appear>
  );
}

function PollsContent() {
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const [open, closed] = useMemo(() => {
    const polls = data?.polls ?? [];
    return [
      polls.filter(p => isPollOpen(p)),
      polls.filter(p => !isPollOpen(p)),
    ];
  }, [data]);

  return (
    <Screen
      header={<Header title="Polls & surveys" />}
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && data.polls.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No polls right now"
            message="When the committee asks for your opinion, it will appear here."
          />
        ) : null}
        {data && open.length ? (
          <View>
            <SectionHeader overline="Your voice matters" title="Open polls" />
            <View style={styles.list}>
              {open.map((p, i) => (
                <PollCard key={p.id} poll={p} data={data} index={i} />
              ))}
            </View>
          </View>
        ) : null}
        {data && closed.length ? (
          <View>
            <SectionHeader title="Past results" />
            <View style={styles.list}>
              {closed.map((p, i) => (
                <PollCard
                  key={p.id}
                  poll={p}
                  data={data}
                  index={open.length + i}
                />
              ))}
            </View>
          </View>
        ) : null}
      </QueryState>
    </Screen>
  );
}

export function PollsScreen() {
  return (
    <GatedScreen
      title="Polls & surveys"
      message="Sign in to vote in community polls."
    >
      <PollsContent />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  list: { gap: 12 },
});
