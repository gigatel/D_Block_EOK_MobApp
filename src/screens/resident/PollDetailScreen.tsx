import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, CircleCheck, Lock, SearchX } from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  EmptyState,
  Header,
  Icon,
  PressableScale,
  ProgressBar,
  Screen,
  Text,
} from '@/components';
import {
  isPollOpen,
  pollResults,
  useBootstrap,
  useSave,
} from '@/features/data';
import type { RootScreenProps } from '@/navigation/types';
import { useTheme } from '@/theme';
import { formatDateTime, timeUntil } from '@/utils/date';
import { newId } from '@/utils/ids';
import { GatedScreen } from './components/GatedScreen';
import { QueryState } from './components/QueryState';

function PollDetailContent({ id }: { id: string }) {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const save = useSave();
  const [choice, setChoice] = useState<string | null>(null);

  const poll = data?.polls.find(p => p.id === id);
  const results = data && poll ? pollResults(data, poll) : null;
  const open = poll ? isPollOpen(poll) : false;
  const showResults = !!results && (!open || !!results.myOptionId);

  const vote = async () => {
    if (!poll || !choice) return;
    try {
      await save.mutateAsync({
        collection: 'poll-responses',
        id: newId('pr'),
        body: { pollId: poll.id, optionId: choice },
        successMessage: 'Thanks — your vote is recorded',
      });
    } catch {
      // toast shown by useSave
    }
  };

  return (
    <Screen
      header={<Header title="Poll" />}
      onRefresh={refetch}
      refreshing={isRefetching}
      footer={
        poll && open && results && !results.myOptionId ? (
          <Button
            title="Submit vote"
            icon={Check}
            onPress={vote}
            disabled={!choice}
            loading={save.isPending}
            size="lg"
          />
        ) : undefined
      }
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {!poll || !results ? (
          <EmptyState icon={SearchX} title="Poll not found" />
        ) : (
          <>
            <Appear index={0} style={{ gap: theme.spacing.sm }}>
              <View style={styles.row}>
                <Badge
                  label={open ? 'Open' : 'Closed'}
                  tone={open ? 'success' : 'neutral'}
                  icon={open ? undefined : Lock}
                />
                <Text variant="caption" color="muted">
                  {open
                    ? `Closes ${timeUntil(poll.closesAt)} · ${formatDateTime(
                        poll.closesAt,
                      )}`
                    : `Closed ${formatDateTime(poll.closesAt)}`}
                </Text>
              </View>
              <Text variant="h2" accessibilityRole="header">
                {poll.question}
              </Text>
              {poll.description ? (
                <Text color="muted">{poll.description}</Text>
              ) : null}
              {poll.createdAt ? (
                <Text variant="caption" color="muted">
                  Posted {formatDateTime(poll.createdAt)}
                </Text>
              ) : null}
            </Appear>

            {showResults ? (
              <View style={{ gap: theme.spacing.md }}>
                {results.options.map((o, i) => {
                  const mine = o.id === results.myOptionId;
                  const pct = Math.round(o.share * 100);
                  return (
                    <Appear key={o.id} index={i + 1}>
                      <Card
                        variant={mine ? 'accent' : 'elevated'}
                        style={{ gap: theme.spacing.sm }}
                        accessibilityLabel={`${o.label}: ${pct} percent, ${
                          o.votes
                        } votes${mine ? ', your vote' : ''}`}
                      >
                        <View style={styles.row}>
                          <Text variant="bodyStrong" style={styles.flex}>
                            {o.label}
                          </Text>
                          {mine ? (
                            <Icon
                              icon={CircleCheck}
                              size={18}
                              color="primary"
                            />
                          ) : null}
                          <Text variant="title">{pct}%</Text>
                        </View>
                        <ProgressBar
                          value={o.share}
                          color={mine ? 'primary' : 'accent'}
                          height={10}
                        />
                        <Text variant="caption" color="muted">
                          {o.votes} vote{o.votes === 1 ? '' : 's'}
                        </Text>
                      </Card>
                    </Appear>
                  );
                })}
                <Text variant="small" color="muted" align="center">
                  {results.total} resident{results.total === 1 ? '' : 's'} voted
                  · ballots are secret
                </Text>
              </View>
            ) : (
              <View
                style={{ gap: theme.spacing.md }}
                accessibilityRole="radiogroup"
              >
                {results.options.map((o, i) => {
                  const selected = o.id === choice;
                  return (
                    <Appear key={o.id} index={i + 1}>
                      <PressableScale
                        onPress={() => setChoice(o.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={o.label}
                        style={[
                          styles.option,
                          {
                            minHeight: theme.touchTarget + 16,
                            borderRadius: theme.radius.lg,
                            backgroundColor: selected
                              ? theme.colors.primarySoft
                              : theme.colors.surface,
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.border,
                            borderWidth: selected ? 2 : 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: selected
                                ? theme.colors.primary
                                : theme.colors.muted,
                              backgroundColor: selected
                                ? theme.colors.primary
                                : 'transparent',
                            },
                          ]}
                        >
                          {selected ? (
                            <Icon
                              icon={Check}
                              size={14}
                              color="onPrimary"
                              strokeWidth={3}
                            />
                          ) : null}
                        </View>
                        <Text variant="bodyStrong" style={styles.flex}>
                          {o.label}
                        </Text>
                      </PressableScale>
                    </Appear>
                  );
                })}
                <Text variant="caption" color="muted" align="center">
                  One vote per resident. You can’t change it after submitting.
                </Text>
              </View>
            )}
          </>
        )}
      </QueryState>
    </Screen>
  );
}

export function PollDetailScreen({ route }: RootScreenProps<'PollDetail'>) {
  return (
    <GatedScreen title="Poll" message="Sign in to vote in community polls.">
      <PollDetailContent id={route.params.id} />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  flex: { flex: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
