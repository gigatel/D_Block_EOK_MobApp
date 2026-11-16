import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Radio,
  Undo2,
  Wand2,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  IconButton,
  SectionHeader,
  Text,
} from '@/components';
import { daysInMonth, istIso } from '@/features/admin/themeHelpers';
import { useBootstrap } from '@/features/data';
import { useThemePreview } from '@/store/themePreview';
import { toast } from '@/store/toast';
import {
  resolveTheme,
  useReduceMotion,
  useTheme,
  useThemeState,
} from '@/theme';
import type { WeatherCondition } from '@/types/models';
import { formatDateLong, formatTime, istParts } from '@/utils/date';
import { haptic } from '@/utils/haptics';
import { AdminScreen, SwatchRow } from './components';

type WeatherSel = 'live' | 'none' | WeatherCondition;
const WEATHER: WeatherSel[] = [
  'live',
  'none',
  'clear',
  'cloudy',
  'rain',
  'storm',
  'fog',
  'heat',
  'cold',
];
const WEATHER_LABEL: Record<WeatherSel, string> = {
  live: 'Live',
  none: 'No weather',
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  storm: 'Storm',
  fog: 'Fog',
  heat: 'Heat',
  cold: 'Cold',
};
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) =>
  `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

type Preset = {
  label: string;
  m: number;
  d: number;
  h: number;
  weather: WeatherSel;
  nextYearIfPast?: boolean;
  year?: number;
};
const PRESETS: Preset[] = [
  { label: 'Diwali night', year: 2026, m: 10, d: 8, h: 20, weather: 'clear' },
  { label: 'Holi', year: 2027, m: 2, d: 22, h: 11, weather: 'clear' },
  {
    label: 'Independence Day',
    m: 7,
    d: 15,
    h: 9,
    weather: 'clear',
    nextYearIfPast: true,
  },
  {
    label: 'Republic Day',
    m: 0,
    d: 26,
    h: 9,
    weather: 'clear',
    nextYearIfPast: true,
  },
  {
    label: 'Winter fog morning',
    m: 11,
    d: 20,
    h: 7,
    weather: 'fog',
    nextYearIfPast: true,
  },
  {
    label: 'Monsoon storm',
    m: 6,
    d: 20,
    h: 18,
    weather: 'storm',
    nextYearIfPast: true,
  },
  {
    label: 'Summer heatwave',
    m: 4,
    d: 25,
    h: 14,
    weather: 'heat',
    nextYearIfPast: true,
  },
];

function ChipRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -theme.gutter }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: theme.gutter }}
    >
      {children}
    </ScrollView>
  );
}

export function ThemeSimulatorScreen() {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const { data } = useBootstrap();
  const { previewing } = useThemeState();
  const { simulate, backToLive, simulatedAt, simulatedWeather } =
    useThemePreview();

  const start = istParts(simulatedAt ?? Date.now());
  const [year, setYear] = useState(start.year);
  const [month, setMonth] = useState(start.month);
  const [day, setDay] = useState(start.day);
  const [hour, setHour] = useState(start.hour);
  const [weather, setWeather] = useState<WeatherSel>(
    simulatedWeather === undefined
      ? 'live'
      : simulatedWeather === null
      ? 'none'
      : simulatedWeather,
  );

  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  const at = istIso(year, month, safeDay, hour);

  const result = useMemo(() => {
    if (!data) return null;
    const w =
      weather === 'live'
        ? data.weather
        : weather === 'none'
        ? null
        : { condition: weather };
    return resolveTheme({
      themes: data.themes,
      schedules: data.themeSchedules,
      now: new Date(at),
      weather: w,
      weatherThemesEnabled: data.settings.weatherThemesEnabled,
    });
  }, [data, at, weather]);

  const applyPreset = (p: Preset) => {
    haptic('selection');
    let y = p.year ?? istParts(Date.now()).year;
    if (p.nextYearIfPast && Date.parse(istIso(y, p.m, p.d, p.h)) < Date.now())
      y += 1;
    setYear(y);
    setMonth(p.m);
    setDay(p.d);
    setHour(p.h);
    setWeather(p.weather);
  };

  const apply = () => {
    simulate({
      at,
      weather:
        weather === 'live' ? undefined : weather === 'none' ? null : weather,
    });
    haptic('success');
    toast('Simulation applied — only you see this', 'info');
  };

  const t = result?.theme.tokens.colors;
  return (
    <AdminScreen
      title="Theme simulator"
      permission="themes.manage"
      refresh={false}
      footer={
        <View style={styles.footer}>
          {previewing ? (
            <Button
              title="Back to live"
              icon={Undo2}
              variant="secondary"
              onPress={backToLive}
              style={styles.flex}
            />
          ) : null}
          <Button
            title="Apply to my device"
            icon={Wand2}
            onPress={apply}
            style={styles.flex}
          />
        </View>
      }
    >
      <Text color="muted">
        Pick a date, time and weather to see which theme the engine would
        choose. Applying only changes this device — residents keep seeing the
        live theme.
      </Text>

      {result && t ? (
        <Animated.View
          key={result.theme.id + result.reason}
          entering={reduce ? undefined : FadeIn.duration(250)}
        >
          <Card variant="accent">
            <Text variant="overline" color="muted">
              Would be active
            </Text>
            <View style={styles.resultRow}>
              <View
                style={[
                  styles.resultSwatch,
                  { backgroundColor: t.primary, borderRadius: theme.radius.md },
                ]}
              >
                <View
                  style={[styles.resultAccent, { backgroundColor: t.accent }]}
                />
              </View>
              <View style={styles.flex}>
                <Text variant="h3">{result.theme.name}</Text>
                <Text variant="small" color="muted">
                  {result.reason}
                </Text>
              </View>
            </View>
            <View style={[styles.rowBetween, { marginTop: theme.spacing.md }]}>
              <SwatchRow
                colors={[t.primary, t.accent, t.background, t.surfaceAlt]}
              />
              <Badge
                label={
                  result.source === 'weather'
                    ? 'Weather'
                    : result.source === 'schedule'
                    ? 'Schedule'
                    : 'Default'
                }
                tone={
                  result.source === 'weather'
                    ? 'info'
                    : result.source === 'schedule'
                    ? 'primary'
                    : 'neutral'
                }
                icon={result.source === 'weather' ? Radio : CalendarClock}
              />
            </View>
            <Text variant="caption" color="muted" style={styles.marginTop8}>
              {formatDateLong(at)} · {formatTime(at)} IST
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      <View style={styles.gap10}>
        <SectionHeader title="Quick presets" />
        <ChipRow>
          {PRESETS.map(p => (
            <Chip
              key={p.label}
              label={p.label}
              icon={FlaskConical}
              onPress={() => applyPreset(p)}
            />
          ))}
        </ChipRow>
      </View>

      <View style={styles.gap10}>
        <View style={styles.rowBetween}>
          <Text variant="label">Year</Text>
          <View style={styles.yearRow}>
            <IconButton
              icon={ChevronLeft}
              label="Previous year"
              onPress={() => setYear(y => y - 1)}
              variant="surface"
            />
            <Text variant="h3" accessibilityLiveRegion="polite">
              {year}
            </Text>
            <IconButton
              icon={ChevronRight}
              label="Next year"
              onPress={() => setYear(y => y + 1)}
              variant="surface"
            />
          </View>
        </View>
        <Text variant="label">Month</Text>
        <ChipRow>
          {MONTHS.map((m, i) => (
            <Chip
              key={m}
              label={m}
              selected={i === month}
              onPress={() => setMonth(i)}
            />
          ))}
        </ChipRow>
        <Text variant="label">Day</Text>
        <ChipRow>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
            <Chip
              key={d}
              label={String(d)}
              selected={d === safeDay}
              onPress={() => setDay(d)}
            />
          ))}
        </ChipRow>
        <Text variant="label">Time (IST)</Text>
        <ChipRow>
          {HOURS.map(h => (
            <Chip
              key={h}
              label={hourLabel(h)}
              selected={h === hour}
              onPress={() => setHour(h)}
            />
          ))}
        </ChipRow>
        <Text variant="label">Weather</Text>
        <View style={styles.wrap}>
          {WEATHER.map(w => (
            <Chip
              key={w}
              label={
                w === 'live' && data?.weather
                  ? `Live (${data.weather.condition})`
                  : WEATHER_LABEL[w]
              }
              selected={w === weather}
              onPress={() => setWeather(w)}
            />
          ))}
        </View>
        {data && !data.settings.weatherThemesEnabled ? (
          <Text variant="caption" color="warning">
            Weather themes are switched off in settings, so weather is ignored.
          </Text>
        ) : null}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  gap10: { gap: 10 },
  marginTop8: { marginTop: 8 },
  flex: { flex: 1 },
  footer: { flexDirection: 'row', gap: 8 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  resultSwatch: { width: 52, height: 52, overflow: 'hidden' },
  resultAccent: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
