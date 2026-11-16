/**
 * HYBRID DataService (DATA_MODE='hybrid', development default).
 *
 * Reads: live GET /api/bootstrap is the source of truth for every collection
 * the server returns data for (events, albums, media, themes, weather…). Any
 * collection the server leaves empty — e.g. notices, committee, contacts,
 * residents, complaints, polls for an anonymous caller — keeps showing the
 * demo data, so every screen works as before.
 *
 * Sign-in: the demo numbers (9000000101/102/103) use the demo service as
 * before; every other number signs in against the live server (real SMS OTP).
 * Writes follow the session: a demo session writes to the in-memory store
 * (overlaid on the live lists so edits show), a real session writes to the API.
 */
import type { Bootstrap, Collection } from '@/types/bootstrap';
import { apiService } from '@/services/api/apiService';
import { COLLECTION_KEY, DEMO_MOBILES, mockService } from '@/services/mock/mockService';
import { getToken } from '@/services/storage/tokenStorage';
import type { DataService } from '@/services/data/types';
import { logger } from '@/utils/logger';

type ArrayKey = { [K in keyof Bootstrap]: Bootstrap[K] extends unknown[] ? K : never }[keyof Bootstrap];
type Row = { id: string };

/** Ids written/removed locally, per bootstrap collection. */
const touched = new Map<ArrayKey, Set<string>>();
const removed = new Map<ArrayKey, Set<string>>();

function mark(map: Map<ArrayKey, Set<string>>, key: ArrayKey, id: string) {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

/** Live rows with local edits applied (edited rows replaced, new rows first, deleted rows dropped). */
function overlay(key: ArrayKey, live: Row[], demo: Row[]): Row[] {
  const edits = touched.get(key);
  const gone = removed.get(key);
  if (!edits?.size && !gone?.size) return live;
  const local = new Map(demo.filter(r => edits?.has(r.id)).map(r => [r.id, r]));
  const merged = live.map(r => local.get(r.id) ?? r);
  const liveIds = new Set(live.map(r => r.id));
  const added = [...local.values()].filter(r => !liveIds.has(r.id));
  return [...added, ...merged].filter(r => !gone?.has(r.id));
}

export function mergeBootstrap(live: Bootstrap, demo: Bootstrap): Bootstrap {
  const out: Record<string, unknown> = { ...live };
  for (const [key, value] of Object.entries(demo) as [keyof Bootstrap, unknown][]) {
    if (!Array.isArray(value)) continue;
    const k = key as ArrayKey;
    const liveRows = (live[k] ?? []) as Row[];
    out[k] = liveRows.length > 0 ? overlay(k, liveRows, value as Row[]) : value;
  }
  return {
    ...(out as Bootstrap),
    // Demo session → demo user; real session → the server's user.
    user: demo.user ?? live.user ?? null,
    settings: { ...demo.settings, ...live.settings },
    weather: live.weather ?? demo.weather,
    demoMode: true,
  };
}

const keyOf = (c: Collection) => COLLECTION_KEY[c] as ArrayKey;

const digits = (mobile: string) => mobile.replace(/\D/g, '').slice(-10);
const isDemoMobile = (mobile: string) => DEMO_MOBILES().includes(digits(mobile));
/** Demo tokens look like `mock.<userId>.<random>`; live sessions are a bearer token or a cookie (null). */
const isDemoSession = async () => (await getToken())?.startsWith('mock.') ?? false;
const demoChallenges = new Set<string>();

export const hybridService: DataService = {
  ...mockService,
  mode: 'hybrid',

  checkHealth: () => apiService.checkHealth(),

  async getSession() {
    return (await isDemoSession()) ? mockService.getSession() : apiService.getSession();
  },

  login: (mobile, password) => (isDemoMobile(mobile) ? mockService : apiService).login(mobile, password).then(r => {
    if (r.ok === 'mfa' && isDemoMobile(mobile)) demoChallenges.add(r.challengeId);
    return r;
  }),
  requestOtp: mobile => (isDemoMobile(mobile) ? mockService : apiService).requestOtp(mobile),
  verifyOtp: (mobile, code) => (isDemoMobile(mobile) ? mockService : apiService).verifyOtp(mobile, code),
  verifyMfa: (id, code) => (demoChallenges.has(id) ? mockService : apiService).verifyMfa(id, code),
  resendMfa: id => (demoChallenges.has(id) ? mockService : apiService).resendMfa(id),

  async logout() {
    return (await isDemoSession()) ? mockService.logout() : apiService.logout();
  },
  async changePassword(current, next) {
    return ((await isDemoSession()) ? mockService : apiService).changePassword(current, next);
  },
  async getSmsLog() {
    return ((await isDemoSession()) ? mockService : apiService).getSmsLog();
  },

  async getBootstrap() {
    const [live, demo] = await Promise.allSettled([apiService.getBootstrap(), mockService.getBootstrap()]);
    if (demo.status === 'rejected') throw demo.reason;
    if (live.status === 'rejected') {
      // Server unreachable: keep the app usable on demo data.
      logger.warn('Live bootstrap failed; showing demo data');
      return demo.value;
    }
    return mergeBootstrap(live.value, demo.value);
  },

  async upsert(collection, id, body) {
    if (!(await isDemoSession())) return apiService.upsert(collection, id, body);
    const saved = await mockService.upsert(collection, id, body);
    mark(touched, keyOf(collection), id);
    removed.get(keyOf(collection))?.delete(id);
    return saved;
  },

  async remove(collection, id) {
    if (!(await isDemoSession())) return apiService.remove(collection, id);
    await mockService.remove(collection, id);
    mark(removed, keyOf(collection), id);
  },

  async uploadMedia(albumId, file, onProgress) {
    if (!(await isDemoSession())) return apiService.uploadMedia(albumId, file, onProgress);
    const asset = await mockService.uploadMedia(albumId, file, onProgress);
    mark(touched, 'media', asset.id);
    return asset;
  },
};
