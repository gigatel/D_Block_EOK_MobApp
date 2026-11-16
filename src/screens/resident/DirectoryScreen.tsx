import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BookUser, Droplet, Mail, Phone, Search, SearchX } from 'lucide-react-native';
import {
  Appear,
  Avatar,
  Badge,
  Card,
  ChipGroup,
  EmptyState,
  Header,
  Icon,
  IconButton,
  Input,
  Screen,
  Text,
} from '@/components';
import { directory, residentName, useBootstrap } from '@/features/data';
import { useDebounce } from '@/hooks';
import { useTheme } from '@/theme';
import { RESIDENT_TYPES, type ResidentType } from '@/types/models';
import { formatDate } from '@/utils/date';
import { callNumber, mailTo } from '@/utils/links';
import { GatedScreen } from './components/GatedScreen';
import { QueryState } from './components/QueryState';

const TYPE_TONE: Record<ResidentType, 'primary' | 'info' | 'neutral'> = {
  Owner: 'primary',
  Tenant: 'info',
  Family: 'neutral',
};

const TYPE_FILTERS = ['All', ...RESIDENT_TYPES] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

/** "Member since Mar 2015" — empty when the server sent no join date. */
function memberSince(joinedOn: string): string {
  return joinedOn && !Number.isNaN(Date.parse(joinedOn)) ? `Since ${formatDate(joinedOn)}` : '';
}

function DirectoryContent() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('All');
  const q = useDebounce(query.trim().toLowerCase(), 200);

  const all = useMemo(() => (data ? directory(data) : []), [data]);
  const counts = useMemo(() => {
    const out: Partial<Record<TypeFilter, number>> = { All: all.length };
    for (const r of all) out[r.type] = (out[r.type] ?? 0) + 1;
    return out;
  }, [all]);

  const groups = useMemo(() => {
    const rows = all.filter(r => {
      if (type !== 'All' && r.type !== type) return false;
      if (!q) return true;
      const hay = `${r.firstName} ${r.lastName} ${r.flat?.houseNo ?? ''} ${
        r.occupation ?? ''
      } ${r.bloodGroup ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const letter = (r.lastName[0] ?? '#').toUpperCase();
      map.set(letter, [...(map.get(letter) ?? []), r]);
    }
    return Array.from(map.entries());
  }, [all, type, q]);

  const total = groups.reduce((s, [, rows]) => s + rows.length, 0);

  return (
    <Screen
      header={<Header title="Resident directory" />}
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && !data.settings.allowResidentDirectory ? (
          <EmptyState
            icon={BookUser}
            title="Directory is turned off"
            message="The committee has disabled the resident directory for now."
          />
        ) : (
          <>
            <Input
              label="Search neighbours"
              icon={Search}
              value={query}
              onChangeText={setQuery}
              placeholder="Name, house number or occupation"
              autoCorrect={false}
              returnKeyType="search"
              hint={`${total} resident${
                total === 1 ? '' : 's'
              } listed · only those who opted in are shown`}
            />
            <ChipGroup
              options={TYPE_FILTERS.filter(f => f === 'All' || counts[f])}
              value={type}
              onChange={setType}
              counts={counts}
            />
            {groups.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matches"
                message="Try a different name or house number."
              />
            ) : (
              groups.map(([letter, rows], gi) => (
                <View key={letter} style={{ gap: theme.spacing.sm }}>
                  <Text
                    variant="overline"
                    color="accent"
                    accessibilityRole="header"
                  >
                    {letter}
                  </Text>
                  {rows.map((r, i) => {
                    const name = residentName(r);
                    return (
                      <Appear key={r.id} index={gi + i}>
                        <Card
                          padding="sm"
                          style={styles.row}
                          accessibilityLabel={`${name}, ${
                            r.flat?.houseNo ?? ''
                          }, ${r.type}`}
                        >
                          <Avatar name={name} color={r.avatarColor} />
                          <View style={styles.flex}>
                            <Text variant="bodyStrong" numberOfLines={1}>
                              {name}
                            </Text>
                            <Text
                              variant="small"
                              color="muted"
                              numberOfLines={1}
                            >
                              {[
                                r.flat?.houseNo,
                                r.flat?.floor ? `${r.flat.floor} floor` : null,
                                r.occupation,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </Text>
                            {r.mobile ? (
                              <Text variant="caption" color="muted">
                                {r.mobile}
                              </Text>
                            ) : null}
                            {r.email ? (
                              <Text
                                variant="caption"
                                color="muted"
                                numberOfLines={1}
                              >
                                {r.email}
                              </Text>
                            ) : null}
                            <View style={styles.meta}>
                              <Badge label={r.type} tone={TYPE_TONE[r.type]} />
                              {r.bloodGroup ? (
                                <View style={styles.inline}>
                                  <Icon icon={Droplet} size={12} color="danger" />
                                  <Text variant="caption" color="muted">
                                    {r.bloodGroup}
                                  </Text>
                                </View>
                              ) : null}
                              {memberSince(r.joinedOn) ? (
                                <Text variant="caption" color="muted">
                                  {memberSince(r.joinedOn)}
                                </Text>
                              ) : null}
                              {!r.mobile ? (
                                <Text variant="caption" color="muted">
                                  Phone hidden
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <View style={styles.actions}>
                            {r.mobile ? (
                              <IconButton
                                icon={Phone}
                                label={`Call ${name}`}
                                variant="tonal"
                                color="primary"
                                onPress={() => callNumber(r.mobile)}
                              />
                            ) : null}
                            {r.email ? (
                              <IconButton
                                icon={Mail}
                                label={`Email ${name}`}
                                variant="tonal"
                                color="primary"
                                onPress={() => mailTo(r.email!)}
                              />
                            ) : null}
                          </View>
                        </Card>
                      </Appear>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}
      </QueryState>
    </Screen>
  );
}

export function DirectoryScreen() {
  return (
    <GatedScreen
      title="Resident directory"
      message="The resident directory is visible only to signed-in D Block residents."
    >
      <DirectoryContent />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 2 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actions: { gap: 8 },
});
