/**
 * MOCK DataService — emulates the ASP.NET Core API in memory, including the
 * server-side filtering rules (role, album visibility, directory privacy,
 * secret ballots) so the prototype behaves like production.
 *
 * Demo accounts (fake numbers):
 *   9000000101 / demo1234  Resident (Anjali Sharma, D-42)
 *   9000000102 / demo1234  Admin — two-step: OTP 123456 (Rajesh Malhotra)
 *   9000000103 / demo1234  Editor — two-step: OTP 123456 (Priya Kapoor)
 * Any OTP sign-in uses code 123456.
 */
import type { Bootstrap, Collection } from '@/types/bootstrap';
import {
  PERMISSIONS,
  type MediaAsset,
  type Permission,
  type RoleKey,
  type SessionUser,
} from '@/types/models';
import { ApiError } from '@/services/api/errors';
import { getToken } from '@/services/storage/tokenStorage';
import type {
  DataService,
  LoginResult,
  OtpRequestResult,
  UploadFile,
} from '@/services/data/types';
import { fullDataset, photo, smsLog } from './fixtures';

export const DEMO_OTP = '123456';
export const DEMO_PASSWORD = 'demo1234';

type Account = {
  userId: string;
  residentId: string;
  mobile: string;
  roles: RoleKey[];
  permissions: Permission[];
  twoStep: boolean;
};

const EDITOR_PERMS: Permission[] = [
  'dashboard.view',
  'events.manage',
  'announcements.manage',
  'media.upload',
  'albums.manage',
  'themes.manage',
];
const ADMIN_PERMS: Permission[] = PERMISSIONS.filter(p => p !== 'users.manage');

/** Demo sign-in numbers (handled by the demo service in hybrid mode). */
export const DEMO_MOBILES = (): string[] => ACCOUNTS.map(a => a.mobile);

const ACCOUNTS: Account[] = [
  { userId: 'u-001', residentId: 'r-001', mobile: '9000000101', roles: ['Resident'], permissions: [], twoStep: false },
  { userId: 'u-002', residentId: 'r-002', mobile: '9000000102', roles: ['Admin', 'Resident'], permissions: ADMIN_PERMS, twoStep: true },
  { userId: 'u-003', residentId: 'r-003', mobile: '9000000103', roles: ['Editor', 'Resident'], permissions: EDITOR_PERMS, twoStep: true },
];

// ---- In-memory "database" ------------------------------------------------------
type Db = ReturnType<typeof fullDataset>;
const db: Db = JSON.parse(JSON.stringify(fullDataset()));
/** Non-array collections → db key. */
export const COLLECTION_KEY: Record<Collection, keyof Db> = {
  residents: 'residents',
  events: 'events',
  registrations: 'registrations',
  announcements: 'announcements',
  albums: 'albums',
  media: 'media',
  complaints: 'complaints',
  'complaint-updates': 'complaintUpdates',
  polls: 'polls',
  'poll-responses': 'pollResponses',
  notifications: 'notifications',
  themes: 'themes',
  'theme-schedules': 'themeSchedules',
};

/** Revoked mock tokens. Tokens encode the user id so a demo session survives app restarts. */
const revoked = new Set<string>();
const otpState = new Map<string, { attempts: number; resendAt: number }>();
const mfaChallenges = new Map<string, { account: Account; attempts: number; resendAt: number }>();

const latency = (min = 250, max = 650) =>
  new Promise<void>(r => setTimeout(r, min + Math.random() * (max - min)));
const randomId = () => Math.random().toString(36).slice(2, 10);

function toUser(a: Account): SessionUser {
  const r = db.residents.find(x => x.id === a.residentId)!;
  return {
    id: a.userId,
    residentId: a.residentId,
    name: `${r.firstName} ${r.lastName}`,
    mobile: a.mobile,
    roles: a.roles,
    permissions: a.permissions,
    twoStep: a.twoStep,
  };
}

function issueSession(a: Account): LoginResult {
  const token = `mock.${a.userId}.${randomId()}${randomId()}`;
  return {
    ok: true,
    user: toUser(a),
    token,
    expiresAt: new Date(Date.now() + 12 * 3600_000).toISOString(),
  };
}

async function currentAccount(): Promise<Account | null> {
  const token = await getToken();
  if (!token || revoked.has(token)) {
    return null;
  }
  const userId = token.split('.')[1];
  return ACCOUNTS.find(x => x.userId === userId) ?? null;
}

async function requireAccount(): Promise<Account> {
  const a = await currentAccount();
  if (!a) {
    throw new ApiError({ message: 'Please sign in again.', status: 401, code: 'HTTP_401' });
  }
  return a;
}

function requirePermission(a: Account, p: Permission) {
  if (!a.permissions.includes(p)) {
    throw new ApiError({ message: 'You do not have permission to do that.', status: 403, code: 'HTTP_403' });
  }
}

const normaliseMobile = (m: string) => m.replace(/\D/g, '').slice(-10);

// ---- Bootstrap filtering (mirrors the server) --------------------------------------
function buildBootstrap(a: Account | null): Bootstrap {
  const has = (p: Permission) => !!a?.permissions.includes(p);
  const isCommittee = !!a && a.roles.some(r => r !== 'Resident');
  const base = {
    committee: db.committee,
    contacts: db.contacts,
    themes: db.themes,
    themeAssets: db.themeAssets,
    themeSchedules: db.themeSchedules,
    settings: db.settings,
    weather: db.weather,
    serverTime: new Date().toISOString(),
    demoMode: true,
  };

  if (!a) {
    const albums = db.albums.filter(al => al.visibility === 'Public');
    const ids = new Set(albums.map(al => al.id));
    return {
      ...base,
      user: null,
      residents: [],
      properties: [],
      mappings: [],
      events: db.events.filter(e => e.isPublic),
      registrations: [],
      announcements: db.announcements.filter(n => n.visibility === 'Public'),
      albums,
      media: db.media.filter(m => ids.has(m.albumId)),
      complaints: [],
      complaintUpdates: [],
      polls: [],
      pollResponses: [],
      notifications: [],
      audit: [],
    };
  }

  const manageResidents = has('residents.manage');
  const residents = db.residents
    .filter(r => r.id === a.residentId || manageResidents || (db.settings.allowResidentDirectory && r.showInDirectory))
    .map(r => {
      if (r.id === a.residentId || manageResidents) {
        return r;
      }
      return {
        ...r,
        mobile: r.showPhone ? r.mobile : '',
        email: r.showEmail ? r.email : null,
        profile: null,
        privacy: undefined,
      };
    });
  const albums = db.albums.filter(al => al.visibility !== 'Committee' || isCommittee);
  const albumIds = new Set(albums.map(al => al.id));
  const complaints = has('complaints.manage')
    ? db.complaints
    : db.complaints.filter(c => c.residentId === a.residentId);
  const complaintIds = new Set(complaints.map(c => c.id));
  const anonymise = <T extends { residentId: string }>(rows: T[], visible: boolean) =>
    rows.map(r => (visible || r.residentId === a.residentId ? r : { ...r, residentId: '' }));

  return {
    ...base,
    user: toUser(a),
    residents,
    properties: db.properties,
    mappings: db.mappings,
    events: db.events,
    registrations: anonymise(db.registrations, has('events.manage')),
    announcements: db.announcements,
    albums,
    media: db.media.filter(m => albumIds.has(m.albumId)),
    complaints,
    complaintUpdates: db.complaintUpdates.filter(u => complaintIds.has(u.complaintId)),
    polls: db.polls,
    pollResponses: anonymise(db.pollResponses, has('polls.manage')),
    notifications: db.notifications.filter(n => !n.residentId || n.residentId === a.residentId),
    audit: has('audit.view') ? db.audit : [],
  };
}

// ---- Service -------------------------------------------------------------------------
export const mockService: DataService = {
  mode: 'mock',

  async checkHealth() {
    await latency();
    return { status: 'healthy', time: new Date().toISOString() };
  },

  async getBootstrap() {
    await latency();
    return JSON.parse(JSON.stringify(buildBootstrap(await currentAccount())));
  },

  async getSession() {
    await latency(100, 200);
    const a = await currentAccount();
    return a ? toUser(a) : null;
  },

  async login(mobile, password) {
    await latency(500, 900);
    const account = ACCOUNTS.find(x => x.mobile === normaliseMobile(mobile));
    if (!account || password !== DEMO_PASSWORD) {
      return { ok: false, error: 'Incorrect mobile number or password.' };
    }
    if (account.twoStep) {
      const challengeId = `mfa-${randomId()}`;
      mfaChallenges.set(challengeId, { account, attempts: 0, resendAt: Date.now() + 30_000 });
      return { ok: 'mfa', challengeId, mobileHint: `•••••• ${account.mobile.slice(-4)}`, resendIn: 30 };
    }
    return issueSession(account);
  },

  async requestOtp(mobile): Promise<OtpRequestResult> {
    await latency(400, 800);
    const m = normaliseMobile(mobile);
    const state = otpState.get(m);
    if (state && state.resendAt > Date.now()) {
      return { ok: false, error: 'Please wait before requesting another code.', resendIn: Math.ceil((state.resendAt - Date.now()) / 1000) };
    }
    otpState.set(m, { attempts: 0, resendAt: Date.now() + 30_000 });
    // Never reveal whether the number is registered.
    return { ok: true, resendIn: 30, expiresInSec: db.settings.otpExpiryMinutes * 60 };
  },

  async verifyOtp(mobile, code) {
    await latency(400, 800);
    const m = normaliseMobile(mobile);
    const state = otpState.get(m) ?? { attempts: 0, resendAt: 0 };
    const max = db.settings.otpMaxAttempts;
    if (state.attempts >= max) {
      return { ok: false, error: 'Too many attempts. Request a new code.', attemptsLeft: 0 };
    }
    const account = ACCOUNTS.find(x => x.mobile === m);
    if (code !== DEMO_OTP || !account) {
      state.attempts += 1;
      otpState.set(m, state);
      return { ok: false, error: 'That code is not correct.', attemptsLeft: max - state.attempts };
    }
    // The app signs everyone in with mobile + SMS code (no password), committee included.
    otpState.delete(m);
    return issueSession(account);
  },

  async verifyMfa(challengeId, code) {
    await latency(400, 800);
    const ch = mfaChallenges.get(challengeId);
    if (!ch) {
      return { ok: false, error: 'This sign-in has expired. Please start again.' };
    }
    const max = db.settings.otpMaxAttempts;
    if (code !== DEMO_OTP) {
      ch.attempts += 1;
      if (ch.attempts >= max) {
        mfaChallenges.delete(challengeId);
      }
      return { ok: false, error: 'That code is not correct.', attemptsLeft: Math.max(0, max - ch.attempts) };
    }
    mfaChallenges.delete(challengeId);
    return issueSession(ch.account);
  },

  async resendMfa(challengeId) {
    await latency();
    const ch = mfaChallenges.get(challengeId);
    if (!ch) {
      return { ok: false, error: 'This sign-in has expired. Please start again.' };
    }
    if (ch.resendAt > Date.now()) {
      return { ok: false, error: 'Please wait before resending.', resendIn: Math.ceil((ch.resendAt - Date.now()) / 1000) };
    }
    ch.resendAt = Date.now() + 30_000;
    return { ok: true, resendIn: 30, expiresInSec: 300 };
  },

  async logout() {
    await latency(100, 250);
    const token = await getToken();
    if (token) {
      revoked.add(token);
    }
  },

  async changePassword(current, next) {
    await latency();
    await requireAccount();
    if (current !== DEMO_PASSWORD) {
      throw new ApiError({ message: 'Current password is incorrect.', status: 400, code: 'BAD_PASSWORD' });
    }
    if (next.length < 8) {
      throw new ApiError({ message: 'New password must be at least 8 characters.', status: 400, code: 'WEAK_PASSWORD' });
    }
  },

  async upsert(collection, id, body) {
    await latency();
    const a = await requireAccount();
    const guard: Partial<Record<Collection, Permission>> = {
      events: 'events.manage',
      announcements: 'announcements.manage',
      albums: 'albums.manage',
      polls: 'polls.manage',
      themes: 'themes.manage',
      'theme-schedules': 'themes.manage',
    };
    const needed = guard[collection];
    if (needed) {
      requirePermission(a, needed);
    }
    const key = COLLECTION_KEY[collection];
    const rows = db[key] as unknown as { id: string }[];
    const now = new Date().toISOString();
    const existing = rows.findIndex(r => r.id === id);
    let saved: Record<string, unknown> = { ...(body as Record<string, unknown>), id };

    if (collection === 'complaints' && existing < 0) {
      const seq = 146 + db.complaints.length;
      saved = { ...saved, ticketNo: `DB-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`, residentId: a.residentId, createdAt: now, updatedAt: now, status: 'Open' };
    } else if (collection === 'complaints') {
      saved = { ...saved, updatedAt: now };
    }
    if (collection === 'complaint-updates') {
      saved = { ...saved, createdAt: now };
    }
    if (collection === 'registrations') {
      const reg = saved as { eventId: string; adults: number; children: number; status: string };
      const ev = db.events.find(e => e.id === reg.eventId);
      if (ev?.capacity && reg.status === 'Going') {
        const taken = db.registrations
          .filter(r => r.eventId === ev.id && r.status === 'Going' && r.id !== id)
          .reduce((sum, r) => sum + r.adults + r.children, 0);
        if (taken + reg.adults + reg.children > ev.capacity) {
          throw new ApiError({ message: `Only ${Math.max(0, ev.capacity - taken)} places are left.`, status: 409, code: 'CAPACITY' });
        }
      }
      saved = { ...saved, residentId: a.residentId };
    }
    if (collection === 'poll-responses') {
      const resp = saved as { pollId: string };
      if (db.pollResponses.some(r => r.pollId === resp.pollId && r.residentId === a.residentId && r.id !== id)) {
        throw new ApiError({ message: 'You have already voted in this poll.', status: 409, code: 'ALREADY_VOTED' });
      }
      saved = { ...saved, residentId: a.residentId };
    }

    if (existing >= 0) {
      rows[existing] = { ...rows[existing], ...saved };
    } else {
      rows.unshift(saved as { id: string });
    }
    db.audit.unshift({
      id: `au-${randomId()}`,
      at: now,
      actor: toUser(a).name,
      action: existing >= 0 ? 'Updated' : 'Created',
      entity: collection,
      entityId: id,
      details: null,
    });
    return JSON.parse(JSON.stringify(existing >= 0 ? rows[existing] : saved));
  },

  async remove(collection, id) {
    await latency();
    await requireAccount();
    const key = COLLECTION_KEY[collection];
    const rows = db[key] as unknown as { id: string }[];
    const idx = rows.findIndex(r => r.id === id);
    if (idx >= 0) {
      rows.splice(idx, 1);
    }
  },

  async getSmsLog() {
    await latency();
    const a = await requireAccount();
    requirePermission(a, 'settings.manage');
    return JSON.parse(JSON.stringify(smsLog));
  },

  async uploadMedia(albumId, file: UploadFile, onProgress) {
    const a = await requireAccount();
    requirePermission(a, 'media.upload');
    const steps = 12 + Math.round((file.sizeBytes / 20_000_000) * 6);
    for (let i = 1; i <= steps; i++) {
      await new Promise<void>(r => setTimeout(r, 120 + Math.random() * 120));
      onProgress(i / steps);
    }
    // Deterministic demo failure so the retry UI can be exercised.
    if (/fail/i.test(file.name)) {
      throw new ApiError({ message: 'Upload interrupted. Check your connection and retry.', status: null, code: 'NETWORK_ERROR', isNetworkError: true });
    }
    const id = `md-up-${randomId()}`;
    const asset: MediaAsset = {
      id,
      albumId,
      kind: file.kind,
      title: file.name,
      url: photo(id),
      thumbUrl: photo(id, 400, 300),
      posterUrl: file.kind === 'video' ? photo(id) : null,
      width: 1200,
      height: 800,
      durationSec: file.kind === 'video' ? 42 : null,
      sizeBytes: file.sizeBytes,
      status: file.kind === 'video' ? 'Processing' : 'Ready',
      uploadedBy: toUser(a).name,
      uploadedAt: new Date().toISOString(),
    };
    db.media.unshift(asset);
    if (file.kind === 'video') {
      setTimeout(() => {
        const m = db.media.find(x => x.id === id);
        if (m) {
          m.status = 'Ready';
        }
      }, 6000);
    }
    return asset;
  },
};
