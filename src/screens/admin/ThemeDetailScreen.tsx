import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Rocket,
  Star,
  XCircle,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  SectionHeader,
  Text,
} from '@/components';
import { describeWindow } from '@/features/admin/themeHelpers';
import { useBootstrap, useSave } from '@/features/data';
import type { RootStackParamList } from '@/navigation/types';
import { useCan } from '@/store/session';
import { useThemePreview } from '@/store/themePreview';
import { toast } from '@/store/toast';
import {
  buildAppTheme,
  contrastRatio,
  sanitizeTheme,
  sanitizeTokens,
  useTheme,
  withAlpha,
  type AppTheme,
} from '@/theme';
import { PatternBackground } from '@/theme/patterns';
import { haptic } from '@/utils/haptics';
import { AdminScreen } from './components';

/** A miniature home screen rendered with the PREVIEWED theme's tokens (not the live theme). */
function MiniPreview({ p }: { p: AppTheme }) {
  const c = p.colors;
  const content = p.source.content;
  return (
    <View
      style={[
        styles.mini,
        {
          backgroundColor: c.background,
          borderRadius: p.radius.lg,
          borderColor: c.border,
        },
      ]}
      accessibilityLabel={`Preview of ${p.name}`}
    >
      <View style={[styles.miniHero, { backgroundColor: c.primary }]}>
        <PatternBackground
          pattern={p.source.pattern}
          color={c.accent}
          opacity={0.18}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: withAlpha(
                c.heroOverlay,
                p.source.tokens.heroOverlayOpacity * 0.5,
              ),
            },
          ]}
        />
        {content.showGreeting ? (
          <RNText style={[p.type.overline, { color: c.accent }]}>
            {content.greeting}
          </RNText>
        ) : null}
        <RNText style={[p.type.h1, { color: c.onPrimary }]} numberOfLines={2}>
          {content.heroTitle}
        </RNText>
        <RNText
          style={[p.type.small, { color: c.onPrimary, opacity: 0.92 }]}
          numberOfLines={3}
        >
          {content.heroSubtitle}
        </RNText>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        <View
          style={[
            styles.miniCard,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              borderRadius: p.radius.md,
            },
            p.shadow.card,
          ]}
        >
          <RNText style={[p.type.overline, { color: c.accent }]}>Notice</RNText>
          <RNText style={[p.type.title, { color: c.text }]}>
            Water supply on Saturday
          </RNText>
          <RNText style={[p.type.small, { color: c.muted }]}>
            Tankers at the D-30 corner from 10 AM.
          </RNText>
        </View>
        <View style={styles.miniRow}>
          <View
            style={[
              styles.miniBtn,
              { backgroundColor: c.primary, borderRadius: p.radius.md },
            ]}
          >
            <RNText style={[p.type.label, { color: c.onPrimary }]}>RSVP</RNText>
          </View>
          <View
            style={[
              styles.miniBtn,
              { backgroundColor: c.accent, borderRadius: p.radius.md },
            ]}
          >
            <RNText style={[p.type.label, { color: c.onAccent }]}>
              Gallery
            </RNText>
          </View>
          <View
            style={[
              styles.miniBtn,
              { backgroundColor: c.surfaceAlt, borderRadius: p.radius.pill },
            ]}
          >
            <RNText style={[p.type.label, { color: c.text }]}>Chip</RNText>
          </View>
        </View>
      </View>
    </View>
  );
}

function ContrastRow({
  label,
  fg,
  bg,
}: {
  label: string;
  fg: string;
  bg: string;
}) {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= 4.5;
  return (
    <View
      style={styles.contrastRow}
      accessible
      accessibilityLabel={`${label}: contrast ${ratio.toFixed(1)} to 1, ${
        pass ? 'passes' : 'fails'
      } WCAG AA`}
    >
      <View style={[styles.contrastChip, { backgroundColor: bg }]}>
        <RNText style={{ color: fg, fontWeight: '700' }}>Aa</RNText>
      </View>
      <Text variant="small" style={styles.flex}>
        {label}
      </Text>
      <Text variant="label">{ratio.toFixed(1)}:1</Text>
      <Badge
        label={pass ? 'AA' : 'Fail'}
        tone={pass ? 'success' : 'danger'}
        icon={pass ? CheckCircle2 : XCircle}
      />
    </View>
  );
}

export function ThemeDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ThemeDetail'>>();
  const { data } = useBootstrap();
  const canPublish = useCan('themes.publish');
  const preview = useThemePreview(s => s.preview);
  const save = useSave();
  const def = data?.themes.find(t => t.id === params.themeId);
  const defaultDef = data?.themes.find(t => t.isDefault);

  const p = useMemo(
    () =>
      def
        ? buildAppTheme({
            theme: sanitizeTheme(def, sanitizeTokens(defaultDef?.tokens)),
            source: 'preview',
            reason: '',
          })
        : null,
    [def, defaultDef],
  );

  if (!def || !p) {
    return (
      <AdminScreen title="Theme" permission="themes.manage">
        <EmptyState
          title="Theme not found"
          message="It may have been deleted."
        />
      </AdminScreen>
    );
  }

  const schedules = (data?.themeSchedules ?? []).filter(
    s => s.themeId === def.id,
  );
  const c = p.colors;
  const swatches: [string, string][] = [
    ['primary', c.primary],
    ['primaryDark', c.primaryDark],
    ['secondary', c.secondary],
    ['accent', c.accent],
    ['background', c.background],
    ['surface', c.surface],
    ['surfaceAlt', c.surfaceAlt],
    ['text', c.text],
    ['muted', c.muted],
    ['border', c.border],
  ];

  const publish = () =>
    save.mutate({
      collection: 'themes',
      id: def.id,
      body: { ...def, status: 'Published' },
      successMessage: `${def.name} published`,
    });

  const makeDefault = async () => {
    try {
      if (defaultDef && defaultDef.id !== def.id) {
        await save.mutateAsync({
          collection: 'themes',
          id: defaultDef.id,
          body: { ...defaultDef, isDefault: false },
        });
      }
      await save.mutateAsync({
        collection: 'themes',
        id: def.id,
        body: { ...def, isDefault: true },
        successMessage: `${def.name} is now the default theme`,
      });
    } catch {
      // toast shown
    }
  };

  return (
    <AdminScreen title={def.name} permission="themes.manage">
      <Appear index={0}>
        <View style={styles.badges}>
          <Badge
            label={def.status}
            tone={def.status === 'Published' ? 'primary' : 'neutral'}
          />
          {def.isDefault ? (
            <Badge label="Default" tone="accent" icon={Star} />
          ) : null}
          <Badge label={`Layout: ${p.source.layoutPreset}`} tone="neutral" />
          <Badge label={`Pattern: ${p.source.pattern}`} tone="neutral" />
          {def.weatherTrigger ? (
            <Badge label={`Weather: ${def.weatherTrigger}`} tone="info" />
          ) : null}
        </View>
        <Text color="muted" style={styles.marginTop8}>
          {def.description}
        </Text>
      </Appear>

      <Appear index={1}>
        <MiniPreview p={p} />
      </Appear>

      <Appear index={2} style={{ gap: theme.spacing.sm }}>
        <Button
          title="Preview on my device"
          icon={Eye}
          onPress={() => {
            preview(def.id);
            haptic('success');
            toast(`Previewing ${def.name} — only you see this`, 'info');
            navigation.goBack();
          }}
        />
        {canPublish ? (
          <View style={styles.actions}>
            {def.status !== 'Published' ? (
              <Button
                title="Publish"
                icon={Rocket}
                variant="accent"
                onPress={publish}
                loading={save.isPending}
                style={styles.flex}
              />
            ) : null}
            {!def.isDefault && def.status === 'Published' ? (
              <Button
                title="Make default"
                icon={Star}
                variant="secondary"
                onPress={makeDefault}
                loading={save.isPending}
                style={styles.flex}
              />
            ) : null}
          </View>
        ) : (
          <Text variant="caption" color="muted" align="center">
            Publishing needs the “themes.publish” permission.
          </Text>
        )}
      </Appear>

      <View>
        <SectionHeader title="Colours" overline="Sanitised tokens" />
        <Card>
          <View style={styles.swatchGrid}>
            {swatches.map(([name, hex]) => (
              <View
                key={name}
                style={styles.swatchItem}
                accessible
                accessibilityLabel={`${name} ${hex}`}
              >
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: hex,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.sm,
                    },
                  ]}
                />
                <Text variant="caption" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="caption" color="muted">
                  {hex}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View>
        <SectionHeader title="Accessibility" overline="WCAG AA needs 4.5:1" />
        <Card style={styles.gap10}>
          <ContrastRow
            label="Body text on background"
            fg={c.text}
            bg={c.background}
          />
          <ContrastRow
            label="Muted text on surface"
            fg={c.muted}
            bg={c.surface}
          />
          <ContrastRow
            label="Button text on primary"
            fg={c.onPrimary}
            bg={c.primary}
          />
          <ContrastRow label="Text on accent" fg={c.onAccent} bg={c.accent} />
        </Card>
      </View>

      <View>
        <SectionHeader title="Typography" />
        <Card style={styles.gap6}>
          <RNText style={[p.type.h2, { color: theme.colors.text }]}>
            {p.source.tokens.typography.headingFont}
          </RNText>
          <RNText style={[p.type.body, { color: theme.colors.muted }]}>
            Body: {p.source.tokens.typography.bodyFont} ·{' '}
            {p.source.tokens.typography.baseSize}px · heading weight{' '}
            {p.source.tokens.typography.headingWeight} · radius{' '}
            {p.source.tokens.radius} · shadow {p.source.tokens.shadow}
          </RNText>
          <Text variant="caption" color="muted">
            Phase 1 maps whitelisted fonts to the closest system serif/sans
            until the font files are bundled.
          </Text>
        </Card>
      </View>

      <View>
        <SectionHeader title="Content & decorations" />
        <Card style={styles.gap8}>
          <Text variant="label">Hero title</Text>
          <Text>{p.source.content.heroTitle}</Text>
          <Text variant="label">Subtitle</Text>
          <Text color="muted">{p.source.content.heroSubtitle}</Text>
          <Text variant="label">
            Greeting {p.source.content.showGreeting ? '' : '(hidden)'}
          </Text>
          <Text color="muted">{p.source.content.greeting}</Text>
          <Text variant="label">Decorations</Text>
          <View style={styles.badges}>
            {p.source.decorations.length ? (
              p.source.decorations.map(d => (
                <Badge key={d} label={d} tone="accent" />
              ))
            ) : (
              <Text color="muted">None</Text>
            )}
          </View>
        </Card>
      </View>

      <View>
        <SectionHeader title="Schedules" />
        <Card padding="sm">
          {schedules.length ? (
            schedules.map(s => (
              <View key={s.id} style={styles.schedule}>
                <Icon
                  icon={CalendarClock}
                  color={s.enabled ? 'primary' : 'muted'}
                />
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{s.label}</Text>
                  <Text variant="caption" color="muted">
                    {describeWindow(s)} · priority {s.priority}
                    {s.enabled ? '' : ' · disabled'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text color="muted" style={styles.padding8}>
              {def.weatherTrigger
                ? `Activated automatically by live weather (“${def.weatherTrigger}”).`
                : def.isDefault
                ? 'Used whenever nothing else is scheduled.'
                : 'Not scheduled.'}
            </Text>
          )}
        </Card>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  gap10: { gap: 10 },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  marginTop8: { marginTop: 8 },
  padding8: { padding: 8 },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', gap: 8 },
  mini: { overflow: 'hidden', borderWidth: 1 },
  miniHero: {
    padding: 18,
    paddingTop: 28,
    gap: 6,
    minHeight: 190,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  miniCard: { padding: 12, gap: 2, borderWidth: 1 },
  miniRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  miniBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchItem: { width: 86, gap: 2 },
  swatch: { height: 44, borderWidth: 1 },
  contrastRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contrastChip: {
    width: 40,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
});
