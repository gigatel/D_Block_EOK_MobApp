/**
 * Adapts a live GET /api/bootstrap payload to the app's `Bootstrap` type.
 *
 * The server (built for the Angular site) differs from the app model in a few
 * small ways, so this layer keeps the screens unchanged:
 *  - collections the caller may not see are omitted or empty → always arrays
 *  - anonymous responses have no `user` key → `null`
 *  - media URLs are site-relative (`/api/media/{id}/thumb`) → absolute
 *  - weather uses `description` where the app reads `summary`
 *  - unknown enum values from a newer server fall back to a safe value
 *  - residents carry directory flags under `privacy` → mirrored to top level
 *  - poll options / contacts / committee may lack `sortOrder` → list order
 *  - broadcast notifications use `residentId: "*"` and singular categories
 */
import { env } from '@/config/env';
import type { Bootstrap } from '@/types/bootstrap';
import {
  ANNOUNCEMENT_CATEGORIES,
  CONTACT_CATEGORIES,
  EVENT_CATEGORIES,
  RESIDENT_TYPES,
  RSVP_STATUSES,
  type Announcement,
  type AppNotification,
  type CommitteeMember,
  type EventRegistration,
  type ImportantContact,
  type MediaAsset,
  type NotificationCategory,
  type Poll,
  type PollResponse,
  type Resident,
  type RwaEvent,
  type Weather,
} from '@/types/models';

const ARRAY_KEYS = [
  'residents',
  'properties',
  'mappings',
  'events',
  'registrations',
  'announcements',
  'albums',
  'media',
  'complaints',
  'complaintUpdates',
  'polls',
  'pollResponses',
  'notifications',
  'audit',
  'committee',
  'contacts',
  'themes',
  'themeAssets',
  'themeSchedules',
] as const satisfies readonly (keyof Bootstrap)[];

/**
 * Resolves a site-relative path against the API origin. Absolute https URLs
 * pass through (http only in debug builds); anything else (protocol-relative,
 * `data:`, `javascript:`, path traversal) becomes an empty string, which the
 * image components render as their placeholder.
 */
export function resolveMediaUrl(url: string | null | undefined, base = env.API_BASE_URL): string {
  if (!url) return '';
  if (/^https:\/\//i.test(url) || (__DEV__ && /^http:\/\//i.test(url))) return url;
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('..')) return `${base}${url}`;
  return '';
}

export function normalizeMedia(m: MediaAsset): MediaAsset {
  return {
    ...m,
    url: resolveMediaUrl(m.url),
    thumbUrl: resolveMediaUrl(m.thumbUrl || m.url),
    posterUrl: m.posterUrl ? resolveMediaUrl(m.posterUrl) : m.posterUrl,
  };
}

function normalizeEvent(e: RwaEvent): RwaEvent {
  const category = (EVENT_CATEGORIES as readonly string[]).includes(e.category) ? e.category : 'Community';
  return {
    ...e,
    category,
    summary: e.summary ?? '',
    description: e.description ?? '',
    venue: e.venue ?? '',
    coverImage: e.coverImage ?? '',
    highlights: e.highlights ?? [],
  };
}

const oneOf = <T extends string>(allowed: readonly T[], v: unknown, fallback: T): T =>
  (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const AVATAR_COLORS = ['#2f5d8a', '#8a6d2b', '#6b4c9a', '#2e7d5b', '#a3473b', '#3d6f73'];

/** Live residents: `privacy.{showInDirectory,showPhone,showEmail}`; some servers send `name` only. */
export function normalizeResident(raw: Resident, i = 0): Resident {
  const r = raw as Resident & { name?: string };
  const privacy = r.privacy ?? {};
  const [first = '', ...rest] = str(r.name).trim().split(/\s+/);
  const showInDirectory = bool(r.showInDirectory, bool(privacy.showInDirectory, true));
  const showPhone = bool(r.showPhone, bool(privacy.showPhone, !!r.mobile));
  const showEmail = bool(r.showEmail, bool(privacy.showEmail, !!r.email));
  return {
    ...r,
    firstName: str(r.firstName, first),
    lastName: str(r.lastName, rest.join(' ')),
    mobile: str(r.mobile),
    type: oneOf(RESIDENT_TYPES, r.type, 'Owner'),
    joinedOn: str(r.joinedOn),
    avatarColor: str(r.avatarColor) || AVATAR_COLORS[i % AVATAR_COLORS.length]!,
    showInDirectory,
    showPhone,
    showEmail,
    privacy: { ...privacy, showInDirectory, showPhone, showEmail },
  };
}

function normalizePoll(p: Poll): Poll {
  return {
    ...p,
    isActive: bool(p.isActive, true),
    options: (p.options ?? []).map((o, i) => ({ ...o, label: str(o.label), sortOrder: num(o.sortOrder, i) })),
  };
}

const NOTIFICATION_CATEGORY: Record<string, NotificationCategory> = {
  general: 'general',
  announcement: 'announcements',
  announcements: 'announcements',
  event: 'events',
  events: 'events',
  complaint: 'complaints',
  complaints: 'complaints',
  poll: 'polls',
  polls: 'polls',
  theme: 'theme',
};

function normalizeNotification(n: AppNotification & { body?: string }): AppNotification {
  return {
    ...n,
    // "*" = broadcast to every resident.
    residentId: n.residentId === '*' ? null : n.residentId ?? null,
    message: str(n.message, str(n.body)),
    category: NOTIFICATION_CATEGORY[str(n.category).toLowerCase()] ?? 'general',
    read: n.read === true,
  };
}

function normalizeAnnouncement(a: Announcement): Announcement {
  return {
    ...a,
    category: oneOf(ANNOUNCEMENT_CATEGORIES, a.category, 'General'),
    visibility: a.visibility === 'Residents' ? 'Residents' : 'Public',
    pinned: a.pinned === true,
    author: str(a.author),
  };
}

function normalizeRegistration(r: EventRegistration): EventRegistration {
  return {
    ...r,
    status: oneOf(RSVP_STATUSES, r.status, 'Going'),
    adults: num(r.adults, 1),
    children: num(r.children, 0),
  };
}

function normalizeContact(c: ImportantContact, i: number): ImportantContact {
  return { ...c, category: oneOf(CONTACT_CATEGORIES, c.category, 'Services'), phone: str(c.phone), sortOrder: num(c.sortOrder, i) };
}

function normalizeCommittee(m: CommitteeMember, i: number): CommitteeMember {
  return {
    ...m,
    houseNo: str(m.houseNo),
    phone: str(m.phone),
    avatarColor: str(m.avatarColor) || AVATAR_COLORS[i % AVATAR_COLORS.length]!,
    sortOrder: num(m.sortOrder, i),
  };
}

function normalizeWeather(w: unknown): Weather | null {
  if (!w || typeof w !== 'object') return null;
  const raw = w as Partial<Weather> & { description?: string };
  if (typeof raw.condition !== 'string' || typeof raw.temperatureC !== 'number') return null;
  return { ...raw, condition: raw.condition, temperatureC: raw.temperatureC, summary: raw.summary ?? raw.description ?? '' } as Weather;
}

export function normalizeBootstrap(raw: Record<string, unknown>): Bootstrap {
  const out: Record<string, unknown> = { ...raw };
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(out[key])) out[key] = [];
  }
  const b = out as Bootstrap;
  return {
    ...b,
    user: b.user ?? null,
    residents: b.residents.map(normalizeResident),
    events: b.events.map(normalizeEvent),
    registrations: b.registrations.map(normalizeRegistration),
    announcements: b.announcements.map(normalizeAnnouncement),
    media: b.media.map(normalizeMedia),
    polls: b.polls.map(normalizePoll),
    pollResponses: b.pollResponses.filter((r): r is PollResponse => !!r?.pollId && !!r.optionId),
    notifications: b.notifications.map(normalizeNotification),
    contacts: b.contacts.map(normalizeContact),
    committee: b.committee.map(normalizeCommittee),
    weather: normalizeWeather(raw.weather),
    demoMode: raw.demoMode === true,
    serverTime: typeof raw.serverTime === 'string' ? raw.serverTime : new Date().toISOString(),
  };
}
