import React, { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarClock,
  CloudSun,
  Eye,
  FlaskConical,
  Leaf,
  PartyPopper,
  Radio,
  Sparkles,
  Star,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  ErrorState,
  Icon,
  SectionHeader,
  SkeletonList,
  Text,
} from '@/components';
import { describeWindow } from '@/features/admin/themeHelpers';
import { useBootstrap, useSave } from '@/features/data';
import { useCan } from '@/store/session';
import { useThemePreview } from '@/store/themePreview';
import { toast } from '@/store/toast';
import {
  sanitizeTokens,
  useTheme,
  useThemeState,
  type ThemeDefinition,
} from '@/theme';
import { haptic } from '@/utils/haptics';
import { AdminScreen, SwatchRow } from './components';

const GROUPS: {
  key: NonNullable<ThemeDefinition['group']>;
  title: string;
  overline: string;
  icon: typeof PartyPopper;
}[] = [
  {
    key: 'festival',
    title: 'Festivals',
    overline: 'Priority 20–80',
    icon: PartyPopper,
  },
  {
    key: 'season',
    title: 'Seasons',
    overline: 'Priority 5 · yearly',
    icon: Leaf,
  },
  {
    key: 'weather',
    title: 'Weather',
    overline: 'Beats seasons when live weather matches',
    icon: CloudSun,
  },
];

function ThemeCard({
  def,
  live,
  onOpen,
}: {
  def: ThemeDefinition;
  live: boolean;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const preview = useThemePreview(s => s.preview);
  const t = sanitizeTokens(def.tokens);
  return (
    <Card
      onPress={onOpen}
      accessibilityLabel={`${def.name} theme${live ? ', live now' : ''}. ${
        def.description
      }`}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.swatchBig,
            {
              backgroundColor: t.colors.primary,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View
            style={[styles.swatchAccent, { backgroundColor: t.colors.accent }]}
          />
        </View>
        <View style={styles.flex}>
          <View style={styles.badges}>
            {live ? (
              <Badge label="Live now" tone="success" icon={Radio} />
            ) : null}
            {def.isDefault ? (
              <Badge label="Default" tone="accent" icon={Star} />
            ) : null}
            <Badge
              label={def.status}
              tone={def.status === 'Published' ? 'primary' : 'neutral'}
            />
            {def.weatherTrigger ? (
              <Badge label={`Weather: ${def.weatherTrigger}`} tone="info" />
            ) : null}
          </View>
          <Text variant="title">{def.name}</Text>
          <Text variant="small" color="muted" numberOfLines={2}>
            {def.description}
          </Text>
        </View>
      </View>
      <View style={[styles.rowBetween, { marginTop: theme.spacing.md }]}>
        <SwatchRow
          colors={[
            t.colors.primary,
            t.colors.accent,
            t.colors.background,
            t.colors.surfaceAlt,
            t.colors.text,
          ]}
        />
        <Text
          variant="caption"
          color="muted"
          numberOfLines={1}
          style={styles.shrink}
        >
          {t.typography.headingFont} · {def.pattern}
          {def.decorations.length
            ? ` · ${def.decorations.length} decorations`
            : ''}
        </Text>
      </View>
      <View style={[styles.actions, { marginTop: theme.spacing.md }]}>
        <Button
          title="Preview"
          icon={Eye}
          size="sm"
          variant="soft"
          fullWidth={false}
          onPress={() => {
            preview(def.id);
            haptic('success');
            toast(`Previewing ${def.name} — only you see this`, 'info');
          }}
        />
        <Button
          title="Details"
          size="sm"
          variant="ghost"
          fullWidth={false}
          onPress={onOpen}
        />
      </View>
    </Card>
  );
}

export function ThemeStudioScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { theme: active, previewing } = useThemeState();
  const backToLive = useThemePreview(s => s.backToLive);
  const canManage = useCan('themes.manage');
  const save = useSave();
  const { data, isLoading, error, refetch } = useBootstrap();

  const themesById = useMemo(
    () => new Map((data?.themes ?? []).map(t => [t.id, t])),
    [data],
  );
  const schedules = useMemo(
    () =>
      [...(data?.themeSchedules ?? [])].sort(
        (a, b) => b.priority - a.priority || a.label.localeCompare(b.label),
      ),
    [data],
  );

  return (
    <AdminScreen title="Theme studio" permission="themes.manage">
      <Appear index={0}>
        <Card variant="accent">
          <View style={styles.row}>
            <View
              style={[
                styles.liveIcon,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Icon icon={Sparkles} color="onPrimary" />
            </View>
            <View style={styles.flex}>
              <Text variant="overline" color="muted">
                {previewing ? 'Previewing on this device' : 'Live now'}
              </Text>
              <Text variant="h3">{active.name}</Text>
              <Text variant="small" color="muted">
                {active.resolution.reason}
              </Text>
            </View>
          </View>
          <View style={[styles.actions, { marginTop: theme.spacing.md }]}>
            <Button
              title="Simulator"
              icon={FlaskConical}
              size="sm"
              variant="primary"
              fullWidth={false}
              onPress={() => navigation.navigate('ThemeSimulator')}
            />
            {previewing ? (
              <Button
                title="Back to live"
                size="sm"
                variant="secondary"
                fullWidth={false}
                onPress={backToLive}
              />
            ) : null}
          </View>
        </Card>
      </Appear>

      {isLoading ? (
        <SkeletonList />
      ) : error || !data ? (
        <ErrorState
          message={error?.message ?? 'Could not load themes.'}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {GROUPS.map(g => {
            const list = data.themes.filter(
              t => (t.group ?? 'festival') === g.key,
            );
            if (!list.length) return null;
            return (
              <View key={g.key} style={{ gap: theme.spacing.md }}>
                <SectionHeader title={g.title} overline={g.overline} />
                {list.map((def, i) => (
                  <Appear key={def.id} index={i}>
                    <ThemeCard
                      def={def}
                      live={!previewing && def.id === active.id}
                      onOpen={() =>
                        navigation.navigate('ThemeDetail', { themeId: def.id })
                      }
                    />
                  </Appear>
                ))}
              </View>
            );
          })}

          <View style={{ gap: theme.spacing.md }}>
            <SectionHeader title="Schedules" overline="Highest priority wins" />
            <Card padding="sm">
              {schedules.map((s, i) => {
                const def = themesById.get(s.themeId);
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.scheduleRow,
                      i > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Icon
                      icon={CalendarClock}
                      color={s.enabled ? 'primary' : 'muted'}
                    />
                    <View style={styles.flex}>
                      <Text
                        variant="bodyStrong"
                        color={s.enabled ? 'text' : 'muted'}
                      >
                        {s.label}
                      </Text>
                      <Text variant="caption" color="muted">
                        {def?.name ?? 'Unknown theme'} · {describeWindow(s)}
                      </Text>
                      <View style={styles.badges}>
                        <Badge
                          label={`Priority ${s.priority}`}
                          tone={s.priority >= 20 ? 'accent' : 'neutral'}
                        />
                        <Badge
                          label={
                            s.recurrence === 'Yearly' ? 'Yearly' : 'One-off'
                          }
                          tone="info"
                        />
                        {s.id === active.resolution.scheduleId ? (
                          <Badge label="Active" tone="success" />
                        ) : null}
                      </View>
                    </View>
                    <Switch
                      accessibilityLabel={`${s.label} schedule enabled`}
                      value={s.enabled}
                      disabled={!canManage || save.isPending}
                      onValueChange={enabled =>
                        save.mutate({
                          collection: 'theme-schedules',
                          id: s.id,
                          body: { ...s, enabled },
                          successMessage: `${s.label} ${
                            enabled ? 'enabled' : 'disabled'
                          }`,
                        })
                      }
                      trackColor={{
                        true: theme.colors.primary,
                        false: theme.colors.border,
                      }}
                      thumbColor={theme.colors.surface}
                    />
                  </View>
                );
              })}
            </Card>
          </View>
        </>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flex: { flex: 1, gap: 3 },
  shrink: { flexShrink: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  swatchBig: { width: 54, height: 54, overflow: 'hidden' },
  swatchAccent: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  liveIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
});
