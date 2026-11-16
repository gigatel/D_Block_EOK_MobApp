import { directory, pollResults } from '@/features/data/selectors';
import { extractXsrf } from '../client';
import { normalizeBootstrap, resolveMediaUrl } from '../normalize';
import { bootstrapSchema, loginResultSchema, parseOrThrow } from '../schemas';

const BASE = 'http://api.test';

/** Shape of an anonymous live response: no `user`, several collections omitted. */
const anonymous = {
  events: [
    {
      id: 'e1',
      slug: 'mela',
      title: 'Mela',
      category: 'Fair', // unknown to this app version
      summary: 's',
      description: 'd',
      venue: 'Park',
      startsAt: '2026-11-08T01:30:00.000Z',
      endsAt: '2026-11-08T14:30:00.000Z',
      coverImage: '/api/media/m1/display',
      registrationOpen: true,
      isPublic: true,
      highlights: ['Food'],
    },
  ],
  albums: [{ id: 'a1', slug: 'a', title: 'A', description: '', year: 2025, visibility: 'Public' }],
  media: [
    { id: 'm1', albumId: 'a1', kind: 'image', title: 'x', url: '/api/media/m1/display', thumbUrl: '/api/media/m1/thumb', sizeBytes: 1, status: 'Ready', uploadedBy: 'u', uploadedAt: '2026-01-01T00:00:00Z' },
  ],
  themes: [],
  themeSchedules: [],
  settings: { siteName: 'D Block' },
  serverTime: '2026-11-06T11:05:57.093Z',
  demoMode: false,
  weather: { condition: 'clear', description: 'Clear sky', temperatureC: 27 },
};

describe('normalizeBootstrap', () => {
  const b = normalizeBootstrap(parseOrThrow(bootstrapSchema, anonymous, 'bootstrap') as Record<string, unknown>);

  it('accepts a response without user and fills missing collections', () => {
    expect(b.user).toBeNull();
    expect(b.committee).toEqual([]);
    expect(b.contacts).toEqual([]);
    expect(b.registrations).toEqual([]);
  });

  it('resolves relative media URLs against the API origin', () => {
    expect(b.media[0].thumbUrl).toMatch(/^https?:\/\/.+\/api\/media\/m1\/thumb$/);
    expect(b.media[0].url).toMatch(/\/api\/media\/m1\/display$/);
  });

  it('maps weather.description to summary and unknown categories to Community', () => {
    expect(b.weather?.summary).toBe('Clear sky');
    expect(b.events[0].category).toBe('Community');
  });
});

describe('resolveMediaUrl', () => {
  it.each([
    ['/api/media/x/thumb', `${BASE}/api/media/x/thumb`],
    ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/a.jpg'],
    ['//evil.example/a.jpg', ''],
    ['/api/../etc/passwd', ''],
    ['javascript:alert(1)', ''],
    ['data:image/png;base64,AAAA', ''],
    [null, ''],
  ])('%s → %s', (input, expected) => {
    expect(resolveMediaUrl(input, BASE)).toBe(expected);
  });
});

describe('login result', () => {
  it('accepts a cookie-session success without a token', () => {
    const r = parseOrThrow(loginResultSchema, { ok: true, user: { id: 'u1', name: 'A', roles: ['Resident'], permissions: [] } }, 'login');
    expect(r.ok).toBe(true);
  });
});

describe('extractXsrf', () => {
  it('reads the token from combined or array Set-Cookie headers', () => {
    expect(extractXsrf('dbeok.af=abc; path=/; httponly, XSRF-TOKEN=tok%2B1; path=/; samesite=strict')).toBe('tok+1');
    expect(extractXsrf(['a=b; path=/', 'XSRF-TOKEN=xyz; path=/'])).toBe('xyz');
    expect(extractXsrf(undefined)).toBeNull();
  });
});

describe('redact (dev API log)', () => {
  it('masks passwords, OTP codes and tokens', () => {
    const { redact } = require('../client');
    expect(redact({ mobile: '9811111111', password: 'secret1', client: 'mobile' })).toEqual({ mobile: '9811111111', password: '•••', client: 'mobile' });
    expect(redact(JSON.stringify({ mobile: '98', code: '123456' }))).toEqual({ mobile: '98', code: '•••' });
    expect(redact({ ok: true, token: 'abcdefabcdefabcdef', user: { id: 'u' } })).toEqual({ ok: true, token: '•••', user: { id: 'u' } });
  });
});

describe('session user from the live server', () => {
  it('maps userId → id and keeps extra fields', () => {
    const r = parseOrThrow(
      loginResultSchema,
      { ok: true, user: { userId: 'u-1', residentId: 'r-1', name: 'Test Resident', mobile: '9000000000', roles: ['Resident'], permissions: [], flatLabel: 'D-1 · Ground floor', avatarColor: '#2f5d8a' } },
      'OTP verify',
    );
    expect(r.ok === true && r.user?.id).toBe('u-1');
  });
});

/** Signed-in shapes as sent by the live server (website store models). */
describe('normalizeBootstrap — signed-in collections', () => {
  const raw = {
    ...anonymous,
    residents: [
      {
        id: 'r1', firstName: 'Asha', lastName: 'Kapoor', mobile: '9810010001', email: 'asha@example.in',
        type: 'Owner', occupation: 'Doctor', bloodGroup: 'B+', joinedOn: '2015-04-01', avatarColor: '#123456',
        privacy: { showInDirectory: true, showPhone: false, showEmail: true, smsAlerts: true },
      },
      { id: 'r2', firstName: 'Hidden', lastName: 'Person', mobile: '1', type: 'Tenant', joinedOn: '', privacy: { showInDirectory: false } },
    ],
    polls: [
      { id: 'pl1', question: 'Q?', closesAt: '2026-12-01T00:00:00Z', isActive: true, createdAt: '2026-11-01T00:00:00Z',
        options: [{ id: 'o1', label: 'Yes' }, { id: 'o2', label: 'No' }] },
    ],
    pollResponses: [{ id: 'pr1', pollId: 'pl1', optionId: 'o2', residentId: 'r1', createdAt: '2026-11-02T00:00:00Z' }],
    notifications: [{ id: 'n1', residentId: '*', title: 'T', message: 'M', category: 'announcement', createdAt: '2026-11-01T00:00:00Z', read: false }],
    contacts: [{ id: 'c1', name: 'Police', category: 'Emergency', phone: '112' }, { id: 'c2', name: 'Plumber', category: 'Plumbing', phone: '1' }],
  };
  const b = normalizeBootstrap(parseOrThrow(bootstrapSchema, raw, 'bootstrap') as Record<string, unknown>);

  it('lifts resident privacy flags so the directory shows opted-in residents', () => {
    const rows = directory(b);
    expect(rows.map(r => r.id)).toEqual(['r1']);
    expect(rows[0]).toMatchObject({ mobile: '', email: 'asha@example.in', bloodGroup: 'B+', joinedOn: '2015-04-01' });
  });

  it('orders poll options by position when sortOrder is missing and counts votes', () => {
    const r = pollResults(b, b.polls[0]);
    expect(r.options.map(o => [o.id, o.votes])).toEqual([['o1', 0], ['o2', 1]]);
    expect(r.total).toBe(1);
  });

  it('maps broadcast notifications and singular categories', () => {
    expect(b.notifications[0]).toMatchObject({ residentId: null, category: 'announcements' });
  });

  it('defaults contact sortOrder and unknown categories', () => {
    expect(b.contacts.map(c => [c.category, c.sortOrder])).toEqual([['Emergency', 0], ['Services', 1]]);
  });
});
