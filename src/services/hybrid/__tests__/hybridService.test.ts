import type { Bootstrap } from '@/types/bootstrap';
import { mergeBootstrap } from '../hybridService';

const base = (over: Partial<Bootstrap>): Bootstrap =>
  ({
    user: null, residents: [], properties: [], mappings: [], events: [], registrations: [], announcements: [],
    albums: [], media: [], complaints: [], complaintUpdates: [], polls: [], pollResponses: [], notifications: [],
    audit: [], committee: [], contacts: [], themes: [], themeAssets: [], themeSchedules: [],
    settings: { siteName: 'x' }, serverTime: '2026-11-06T00:00:00Z', demoMode: false, weather: null, ...over,
  }) as unknown as Bootstrap;

describe('mergeBootstrap', () => {
  const live = base({ events: [{ id: 'live-e' }] as never, settings: { siteName: 'Live' } as never, weather: { condition: 'clear', temperatureC: 27, summary: 'Clear' } });
  const demo = base({
    user: { id: 'u' } as never,
    events: [{ id: 'demo-e' }] as never,
    announcements: [{ id: 'demo-n' }] as never,
    committee: [{ id: 'demo-c' }] as never,
    settings: { siteName: 'Demo', tagline: 't' } as never,
  });
  const m = mergeBootstrap(live, demo);

  it('prefers live collections that have data', () => {
    expect(m.events.map(e => e.id)).toEqual(['live-e']);
    expect(m.weather?.summary).toBe('Clear');
    expect(m.settings.siteName).toBe('Live');
  });

  it('keeps demo data for collections the server returns empty', () => {
    expect(m.announcements.map(a => a.id)).toEqual(['demo-n']);
    expect(m.committee.map(c => c.id)).toEqual(['demo-c']);
    expect(m.settings.tagline).toBe('t');
  });

  it('keeps the demo session user', () => {
    expect(m.user?.id).toBe('u');
  });
});
