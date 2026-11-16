/**
 * /dev/components — developer gallery of the in-house component library,
 * the live (automatic) theme, all patterns and all decorations.
 * Registered only when env.SHOW_DEV_TOOLS (never in production).
 *
 * The theme is never chosen here: it follows the festival schedule and the
 * live weather (ThemeProvider → resolveTheme).
 *
 * Performance: decoration tiles are static until tapped (only one animates at
 * a time), the heavy pattern/decoration grids mount after the navigation
 * transition, and each interactive demo keeps its own state so typing or
 * toggling doesn't re-render the whole gallery.
 */
import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  CalendarDays,
  CloudSun,
  Heart,
  Megaphone,
  Palette,
  Plus,
  Search,
  Sparkles,
  User,
} from 'lucide-react-native';
import {
  ArtCover,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  DateBadge,
  DemoBadge,
  Divider,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Input,
  ListItem,
  OtpInput,
  PressableScale,
  ProgressBar,
  Screen,
  SectionHeader,
  SegmentedControl,
  Sheet,
  Skeleton,
  StatTile,
  SwitchRow,
  Text,
  ThemeHero,
  type Tone,
} from '@/components';
import { useBootstrap } from '@/features/data/useBootstrap';
import { toast } from '@/store/toast';
import { useTheme, type TypeVariant } from '@/theme';
import { DecorationLayer } from '@/theme/decorations';
import { PatternBackground } from '@/theme/patterns';
import { DECORATIONS, PATTERNS, type DecorationKey } from '@/theme/types';

const TYPE_VARIANTS: TypeVariant[] = [
  'display',
  'h1',
  'h2',
  'h3',
  'title',
  'body',
  'bodyStrong',
  'small',
  'caption',
  'label',
  'overline',
];
const TONES: Tone[] = [
  'neutral',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
];

const SOURCE_LABEL = {
  schedule: 'Festival / season',
  weather: 'Live weather',
  default: 'Default',
  preview: 'Admin preview',
} as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** True once the screen's opening transition has finished. */
function useAfterTransition(): boolean {
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    // Native-stack emits transitionEnd; the timer covers screens without one.
    const off = navigation.addListener('transitionEnd' as never, done);
    const timer = setTimeout(done, 600);
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [navigation]);
  return ready;
}

/** Read-only: the theme the app picked automatically (festival schedule + weather). */
function LiveTheme() {
  const theme = useTheme();
  const { data } = useBootstrap();
  const weather = data?.weather;
  const c = theme.colors;
  return (
    <Card style={{ gap: theme.spacing.sm }}>
      <ListItem
        icon={Palette}
        title={theme.name}
        subtitle={`${SOURCE_LABEL[theme.resolution.source]} · ${
          theme.resolution.reason
        }`}
      />
      <ListItem
        icon={CloudSun}
        title={
          weather
            ? `${weather.summary || weather.condition} · ${Math.round(
                weather.temperatureC,
              )}°C`
            : 'Weather unavailable'
        }
        subtitle={
          data?.settings.weatherThemesEnabled === false
            ? 'Weather themes are turned off'
            : 'Weather can switch the theme when no festival is on'
        }
      />
      <Row>
        {[c.primary, c.secondary, c.accent, c.background, c.surface].map(
          (col, i) => (
            <View
              key={`${col}-${i}`}
              style={[styles.dot, { backgroundColor: col, borderColor: c.border }]}
            />
          ),
        )}
      </Row>
      {theme.source.decorations.length ? (
        <Row>
          {theme.source.decorations.map(d => (
            <Badge key={d} label={d} tone="accent" icon={Sparkles} />
          ))}
        </Row>
      ) : null}
    </Card>
  );
}

const ChipsDemo = memo(function ChipsDemoImpl() {
  const [chip, setChip] = useState<'All' | 'Festival' | 'Health' | 'Meeting'>(
    'All',
  );
  const [seg, setSeg] = useState<'Upcoming' | 'Past'>('Upcoming');
  return (
    <>
      <ChipGroup
        options={['All', 'Festival', 'Health', 'Meeting'] as const}
        value={chip}
        onChange={setChip}
        counts={{ All: 9, Festival: 3 }}
      />
      <Row>
        <Chip label="With icon" icon={Megaphone} />
        <Chip label="Selected" selected />
      </Row>
      <SegmentedControl
        options={['Upcoming', 'Past'] as const}
        value={seg}
        onChange={setSeg}
      />
    </>
  );
});

const InputsDemo = memo(function InputsDemoImpl() {
  const [toggle, setToggle] = useState(true);
  const [otp, setOtp] = useState('12');
  const [text, setText] = useState('');
  return (
    <>
      <Input
        label="Subject"
        placeholder="Street light not working"
        value={text}
        onChangeText={setText}
        maxLength={60}
        counter
        hint="Keep it short"
        icon={Megaphone}
      />
      <Input
        label="Mobile number"
        value="98765"
        error="Enter a 10-digit mobile number"
        keyboardType="phone-pad"
      />
      <OtpInput value={otp} onChange={setOtp} autoFocus={false} />
      <SwitchRow
        title="SMS alerts"
        subtitle="Receive important notices by SMS"
        value={toggle}
        onChange={setToggle}
        icon={Bell}
      />
    </>
  );
});

const ProgressDemo = memo(function ProgressDemoImpl() {
  const theme = useTheme();
  const [progress, setProgress] = useState(0.35);
  return (
    <>
      <ProgressBar value={progress} />
      <Button
        title="Advance progress"
        size="sm"
        fullWidth={false}
        variant="soft"
        onPress={() => setProgress(p => (p >= 1 ? 0 : Math.min(1, p + 0.2)))}
      />
      <Row>
        <StatTile
          label="Open complaints"
          value={4}
          icon={Megaphone}
          tone="warning"
          hint="2 urgent"
        />
        <StatTile
          label="Upcoming events"
          value={7}
          icon={CalendarDays}
          tone="primary"
        />
      </Row>
      <Row>
        <DateBadge date={new Date().toISOString()} />
        <DateBadge date={new Date().toISOString()} variant="light" />
        <Avatar name="Anjali Sharma" color={theme.colors.primary} />
        <Avatar
          name="Rajesh Malhotra"
          color={theme.colors.secondary}
          size={36}
        />
      </Row>
    </>
  );
});

const FeedbackDemo = memo(function FeedbackDemoImpl() {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <Row>
        <Button
          title="Open sheet"
          size="sm"
          fullWidth={false}
          onPress={() => setSheet(true)}
        />
        <Button
          title="Success toast"
          size="sm"
          variant="soft"
          fullWidth={false}
          onPress={() => toast('Saved successfully')}
        />
        <Button
          title="Error toast"
          size="sm"
          variant="danger"
          fullWidth={false}
          onPress={() => toast('Something went wrong', 'error')}
        />
      </Row>
      <Sheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Bottom sheet"
        subtitle="Keyboard-aware, animated"
        footer={<Button title="Done" onPress={() => setSheet(false)} />}
      >
        <Text>Sheets are used for RSVPs, filters and quick forms.</Text>
        <Input label="Note" placeholder="Optional" />
      </Sheet>
    </>
  );
});

const Patterns = memo(function PatternsImpl() {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {PATTERNS.map(p => (
        <View
          key={p}
          style={[
            styles.tile,
            {
              borderRadius: theme.radius.md,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <PatternBackground
            pattern={p}
            color={theme.colors.primary}
            opacity={0.5}
          />
          <Text variant="caption" color="muted" style={styles.tileLabel}>
            {p}
          </Text>
        </View>
      ))}
    </View>
  );
});

/** Static previews; tap one to animate it (only one runs at a time). */
const Decorations = memo(function DecorationsImpl() {
  const theme = useTheme();
  const [playing, setPlaying] = useState<DecorationKey | null>(null);
  return (
    <>
      <Text variant="small" color="muted">
        Tap a tile to play its animation.
      </Text>
      <View style={styles.grid}>
        {DECORATIONS.map(d => (
          <PressableScale
            key={d}
            onPress={() => setPlaying(p => (p === d ? null : d))}
            accessibilityLabel={`${d} decoration${
              playing === d ? ', playing' : ''
            }`}
            accessibilityState={{ selected: playing === d }}
            style={[
              styles.decoTile,
              {
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primaryDark,
              },
            ]}
          >
            <DecorationLayer decorations={[d]} paused={playing !== d} />
            <Text variant="caption" color="onPrimary" style={styles.tileLabel}>
              {playing === d ? `▶ ${d}` : d}
            </Text>
          </PressableScale>
        ))}
      </View>
    </>
  );
});

export function ComponentGalleryScreen() {
  const theme = useTheme();
  const ready = useAfterTransition();

  return (
    <Screen header={<Header title="Component gallery" right={<DemoBadge />} />}>
      <Section title="Live theme (automatic)">
        <LiveTheme />
      </Section>

      <Section title="Theme hero">
        <View style={{ marginHorizontal: -theme.gutter }}>
          <ThemeHero eyebrow="Good evening, Anjali" compact>
            <Button
              title="Explore events"
              variant="accent"
              fullWidth={false}
              icon={CalendarDays}
            />
          </ThemeHero>
        </View>
      </Section>

      <Section title="Typography">
        {TYPE_VARIANTS.map(v => (
          <Text key={v} variant={v}>
            {v} — D Block, East of Kailash
          </Text>
        ))}
      </Section>

      <Section title="Buttons">
        <Button title="Primary" icon={Sparkles} />
        <Button title="Accent" variant="accent" />
        <Button title="Secondary" variant="secondary" />
        <Button title="Soft" variant="soft" />
        <Button title="Danger" variant="danger" />
        <Button title="Ghost" variant="ghost" />
        <Row>
          <Button title="Small" size="sm" fullWidth={false} />
          <Button title="Loading" loading fullWidth={false} />
          <Button title="Disabled" disabled fullWidth={false} />
        </Row>
        <Button title="Large" size="lg" iconRight={Plus} />
      </Section>

      <Section title="Icon buttons">
        <Row>
          <IconButton icon={Bell} label="Notifications" badge={3} />
          <IconButton icon={Search} label="Search" variant="tonal" />
          <IconButton
            icon={Heart}
            label="Favourite"
            variant="surface"
            color="danger"
          />
          <View
            style={[styles.round, { backgroundColor: theme.colors.primary }]}
          >
            <IconButton
              icon={User}
              label="Profile"
              variant="glass"
              color="onPrimary"
            />
          </View>
        </Row>
      </Section>

      <Section title="Chips & segmented control">
        <ChipsDemo />
      </Section>

      <Section title="Badges">
        <Row>
          {TONES.map(t => (
            <Badge key={t} label={t} tone={t} />
          ))}
        </Row>
      </Section>

      <Section title="Cards & list items">
        <Card>
          <Text variant="title">Elevated card</Text>
          <Text color="muted">Default surface with a soft shadow.</Text>
        </Card>
        <Card variant="tinted">
          <Text variant="title">Tinted card</Text>
        </Card>
        <Card
          variant="accent"
          onPress={() => toast('Card pressed', 'info')}
          accessibilityLabel="Pressable accent card"
        >
          <Text variant="title">Pressable accent card</Text>
        </Card>
        <Card padding="none">
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <ListItem
              title="Diwali Milan"
              subtitle="Sun, 8 Nov · Central Park"
              icon={CalendarDays}
              onPress={() => undefined}
            />
            <Divider inset={52} />
            <ListItem
              title="Sign out"
              icon={User}
              destructive
              onPress={() => undefined}
            />
          </View>
        </Card>
      </Section>

      <Section title="Inputs">
        <InputsDemo />
      </Section>

      <Section title="Progress, stats & dates">
        <ProgressDemo />
      </Section>

      <Section title="Loading & empty states">
        <Skeleton height={18} width="60%" />
        <Skeleton height={80} radius={theme.radius.lg} />
        <Card>
          <EmptyState
            title="No complaints yet"
            message="Raise one when something needs attention."
            actionLabel="New complaint"
            onAction={() => undefined}
          />
        </Card>
        <Card>
          <ErrorState
            message="No internet connection."
            onRetry={() => undefined}
          />
        </Card>
      </Section>

      <Section title="Feedback">
        <FeedbackDemo />
      </Section>

      <Section title="Art covers">
        <Row>
          {['ev-1', 'ev-2', 'al-3', 'an-4'].map(s => (
            <ArtCover
              key={s}
              seed={s}
              icon={Sparkles}
              radius={theme.radius.md}
              style={styles.art}
            />
          ))}
        </Row>
      </Section>

      <Section title={`Patterns (${PATTERNS.length})`}>
        {ready ? <Patterns /> : <Skeleton height={220} radius={theme.radius.md} />}
      </Section>

      <Section title={`Decorations (${DECORATIONS.length})`}>
        {ready ? (
          <Decorations />
        ) : (
          <Skeleton height={320} radius={theme.radius.md} />
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  decoTile: {
    width: '48%',
    aspectRatio: 1.25,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  tileLabel: { padding: 6, fontWeight: '700' },
  art: { width: 76, height: 76 },
  round: { borderRadius: 999 },
});
