import {
  DEFAULT_TOKENS,
  contrastRatio,
  resolveTheme,
  sanitizeContent,
  sanitizeTheme,
  sanitizeTokens,
  windowsFor,
} from '../engine';
import { MOCK_THEMES, MOCK_THEME_SCHEDULES } from '@/services/mock/themes';
import type { ThemeDefinition, ThemeSchedule } from '../types';

const at = (iso: string) => new Date(iso);
const resolveAt = (iso: string, extra: Partial<Parameters<typeof resolveTheme>[0]> = {}) =>
  resolveTheme({
    themes: MOCK_THEMES,
    schedules: MOCK_THEME_SCHEDULES,
    now: at(iso),
    weatherThemesEnabled: true,
    ...extra,
  });

describe('sanitizeTokens', () => {
  it('returns defaults for garbage input', () => {
    expect(sanitizeTokens(null)).toEqual(DEFAULT_TOKENS);
    expect(sanitizeTokens('x')).toEqual(DEFAULT_TOKENS);
  });

  it('rejects invalid colours, fonts and out-of-range numbers', () => {
    const out = sanitizeTokens({
      colors: { primary: 'red', accent: '#abc', text: '#112233', background: 'url(evil)' },
      typography: { headingFont: 'Comic Sans', bodyFont: 'Mukta', baseSize: 40, headingWeight: 800 },
      radius: 99,
      shadow: 'huge',
      heroOverlayOpacity: 1.5,
    });
    expect(out.colors.primary).toBe(DEFAULT_TOKENS.colors.primary);
    expect(out.colors.accent).toBe(DEFAULT_TOKENS.colors.accent);
    expect(out.colors.background).toBe(DEFAULT_TOKENS.colors.background);
    expect(out.colors.text).toBe('#112233');
    expect(out.typography.headingFont).toBe(DEFAULT_TOKENS.typography.headingFont);
    expect(out.typography.bodyFont).toBe('Mukta');
    expect(out.typography.baseSize).toBe(DEFAULT_TOKENS.typography.baseSize);
    expect(out.typography.headingWeight).toBe(DEFAULT_TOKENS.typography.headingWeight);
    expect(out.radius).toBe(DEFAULT_TOKENS.radius);
    expect(out.shadow).toBe(DEFAULT_TOKENS.shadow);
    expect(out.heroOverlayOpacity).toBe(DEFAULT_TOKENS.heroOverlayOpacity);
  });

  it('keeps valid boundary values', () => {
    const out = sanitizeTokens({ radius: 0, heroOverlayOpacity: 0.9, typography: { baseSize: 19 } });
    expect(out.radius).toBe(0);
    expect(out.heroOverlayOpacity).toBe(0.9);
    expect(out.typography.baseSize).toBe(19);
  });
});

describe('sanitizeContent / sanitizeTheme', () => {
  it('truncates and strips markup', () => {
    const c = sanitizeContent({ heroTitle: '<b>Hi</b>' + 'x'.repeat(200), greeting: 5 });
    expect(c.heroTitle.startsWith('Hi')).toBe(true);
    expect(c.heroTitle.length).toBeLessThanOrEqual(90);
    expect(c.greeting).toBe('Welcome home');
  });

  it('drops unknown decorations, patterns and layouts', () => {
    const t = sanitizeTheme({
      ...MOCK_THEMES[0],
      // eslint-disable-next-line no-script-url -- verifies hostile input is rejected
      pattern: 'javascript:alert(1)',
      layoutPreset: 'weird',
      decorations: ['diya-row', 'evil-script', 'diya-row'],
    } as ThemeDefinition);
    expect(t.pattern).toBe('none');
    expect(t.layoutPreset).toBe('classic');
    expect(t.decorations).toEqual(['diya-row']);
  });
});

describe('windowsFor', () => {
  const s: ThemeSchedule = {
    id: 's', themeId: 't', label: 'Winter', priority: 5, recurrence: 'Yearly', enabled: true,
    startsAt: '2024-11-30T18:30:00Z', endsAt: '2025-01-31T18:30:00Z',
  };
  it('repeats yearly windows, including over New Year', () => {
    const w = windowsFor(s, at('2027-01-10T00:00:00Z'));
    const covering = w.filter(x => x.start <= Date.parse('2027-01-10T00:00:00Z') && Date.parse('2027-01-10T00:00:00Z') < x.end);
    expect(covering).toHaveLength(1);
    expect(new Date(covering[0].start).toISOString()).toBe('2026-11-30T18:30:00.000Z');
  });
  it('ignores invalid windows', () => {
    expect(windowsFor({ ...s, endsAt: s.startsAt }, at('2026-01-01T00:00:00Z'))).toEqual([]);
  });
  it('returns the literal window for non-recurring schedules', () => {
    expect(windowsFor({ ...s, recurrence: 'None' }, at('2030-01-01T00:00:00Z'))).toHaveLength(1);
  });
});

describe('resolveTheme', () => {
  it('Diwali (80) beats Autumn season (5) in early November 2026', () => {
    const r = resolveAt('2026-11-06T06:00:00Z');
    expect(r.theme.slug).toBe('diwali');
    expect(r.source).toBe('schedule');
  });

  it('falls back to the season when no festival is active', () => {
    expect(resolveAt('2026-11-20T06:00:00Z').theme.slug).toBe('autumn');
    expect(resolveAt('2027-07-15T06:00:00Z').theme.slug).toBe('monsoon');
  });

  it('applies yearly national days in IST (Republic Day 2027)', () => {
    expect(resolveAt('2027-01-26T03:00:00Z').theme.slug).toBe('republic-day');
  });

  it('weather beats seasons but not festivals', () => {
    expect(resolveAt('2026-11-20T06:00:00Z', { weather: { condition: 'fog' } }).theme.slug).toBe('fog-smog');
    expect(resolveAt('2026-11-06T06:00:00Z', { weather: { condition: 'fog' } }).theme.slug).toBe('diwali');
  });

  it('ignores weather when disabled', () => {
    expect(
      resolveAt('2026-11-20T06:00:00Z', { weather: { condition: 'fog' }, weatherThemesEnabled: false }).theme.slug,
    ).toBe('autumn');
  });

  it('uses the default theme when nothing matches and ignores unpublished themes', () => {
    const r = resolveTheme({
      themes: MOCK_THEMES.map(t => (t.slug === 'autumn' || t.slug === 'diwali' ? { ...t, status: 'Draft' as const } : t)),
      schedules: MOCK_THEME_SCHEDULES,
      now: at('2026-11-06T06:00:00Z'),
    });
    expect(r.theme.slug).toBe('default-rwa');
    expect(r.source).toBe('default');
  });

  it('breaks priority ties by most recent start, then lowest id', () => {
    const themes = MOCK_THEMES;
    const base = { recurrence: 'None' as const, enabled: true, priority: 30, endsAt: '2030-01-01T00:00:00Z' };
    const schedules: ThemeSchedule[] = [
      { ...base, id: 'b', themeId: 'th-holi', label: 'b', startsAt: '2026-01-01T00:00:00Z' },
      { ...base, id: 'a', themeId: 'th-winter', label: 'a', startsAt: '2026-01-01T00:00:00Z' },
      { ...base, id: 'c', themeId: 'th-summer', label: 'c', startsAt: '2025-01-01T00:00:00Z' },
    ];
    expect(resolveTheme({ themes, schedules, now: at('2026-06-01T00:00:00Z') }).theme.slug).toBe('winter');
  });

  it('works with no themes at all (built-in default)', () => {
    const r = resolveTheme({ themes: [], schedules: [], now: new Date() });
    expect(r.theme.tokens).toEqual(DEFAULT_TOKENS);
  });
});

describe('built-in themes meet WCAG AA for body text', () => {
  it.each(MOCK_THEMES.map(t => [t.name, t] as const))('%s', (_name, t) => {
    const { colors } = sanitizeTokens(t.tokens);
    expect(contrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.muted, colors.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
