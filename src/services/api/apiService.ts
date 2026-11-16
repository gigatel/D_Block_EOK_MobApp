/**
 * LIVE DataService — talks to the ASP.NET Core API through the Node SSR proxy.
 * Phase 2: requires the bearer-token mode described in docs/API-GAPS.md §6.1.
 */
import type { Bootstrap } from '@/types/bootstrap';
import type { MediaAsset, SessionUser } from '@/types/models';
import type { DataService, LoginResult, OtpRequestResult, UploadFile } from '@/services/data/types';
import { apiClient } from './client';
import { ApiError, toApiError } from './errors';
import { ENDPOINTS } from './endpoints';
import { normalizeBootstrap, normalizeMedia } from './normalize';
import {
  bootstrapSchema,
  healthSchema,
  loginResultSchema,
  otpRequestSchema,
  parseOrThrow,
  sessionUserSchema,
} from './schemas';

/**
 * POST /api/albums/{id}/media answers with the created asset(s): an array,
 * `{ items | media: [...] }` or a single object. Fall back to a placeholder
 * (bootstrap is refetched right after uploading anyway).
 */
export function pickUploadedAsset(data: unknown, albumId: string, file: UploadFile): MediaAsset {
  const d = data as { items?: unknown[]; media?: unknown[] } | unknown[] | null;
  const raw = (Array.isArray(d) ? d[0] : d?.items?.[0] ?? d?.media?.[0] ?? d) as Partial<MediaAsset> | undefined;
  if (raw && typeof raw === 'object' && typeof raw.id === 'string') {
    return { ...raw, albumId: raw.albumId ?? albumId } as MediaAsset;
  }
  return {
    id: `pending-${Date.now()}`,
    albumId,
    kind: file.kind,
    title: file.name,
    url: '',
    thumbUrl: '',
    sizeBytes: file.sizeBytes,
    status: 'Processing',
    uploadedBy: '',
    uploadedAt: new Date().toISOString(),
  };
}

/** Auth endpoints answer 4xx/429 with `{ ok:false, error }` — surface those as results. */
async function authCall<T>(fn: () => Promise<T>, fallback: (msg: string, retry?: number) => T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const err = toApiError(e);
    if (err.isNetworkError) {
      throw err;
    }
    return fallback(err.message, err.retryAfterSec);
  }
}

/** GET /api/auth/session → `{ user }` (or the user itself); `{}` when signed out. */
async function fetchSessionUser(): Promise<SessionUser | null> {
  const { data } = await apiClient.get(ENDPOINTS.auth.session);
  const raw = data?.user ?? (data?.id ? data : null);
  return raw ? (parseOrThrow(sessionUserSchema, raw, 'session') as SessionUser) : null;
}

/**
 * The server may answer a successful sign-in with just `{ ok: true }` and a
 * session cookie (like the website). Load the signed-in user in that case.
 */
async function withUser(result: LoginResult): Promise<LoginResult> {
  if (result.ok !== true || result.user) return result;
  const user =
    (await fetchSessionUser().catch(() => null)) ??
    ((await apiClient.get(ENDPOINTS.bootstrap).then(r => r.data?.user).catch(() => null)) as unknown);
  if (!user) {
    return { ok: false, error: 'Signed in, but your profile could not be loaded. Please try again.' };
  }
  return { ...result, user: parseOrThrow(sessionUserSchema, user, 'session') as SessionUser };
}

export const apiService: DataService = {
  mode: 'api',

  async checkHealth() {
    const { data } = await apiClient.get(ENDPOINTS.health, { timeout: 6000 });
    return parseOrThrow(healthSchema, data, 'health');
  },

  async getBootstrap(): Promise<Bootstrap> {
    const { data } = await apiClient.get(ENDPOINTS.bootstrap);
    const parsed = parseOrThrow(bootstrapSchema, data, 'bootstrap');
    return normalizeBootstrap(parsed as Record<string, unknown>);
  },

  getSession: fetchSessionUser,

  login: (mobile, password) =>
    authCall<LoginResult>(
      async () => {
        const { data } = await apiClient.post(ENDPOINTS.auth.login, { mobile, password, client: 'mobile' });
        return withUser(parseOrThrow(loginResultSchema, data, 'login') as LoginResult);
      },
      error => ({ ok: false, error }),
    ),

  requestOtp: mobile =>
    authCall<OtpRequestResult>(
      async () => {
        const { data } = await apiClient.post(ENDPOINTS.auth.otpRequest, { mobile });
        return parseOrThrow(otpRequestSchema, data, 'OTP request') as OtpRequestResult;
      },
      (error, resendIn) => ({ ok: false, error, resendIn }),
    ),

  verifyOtp: (mobile, code) =>
    authCall<LoginResult>(
      async () => {
        const { data } = await apiClient.post(ENDPOINTS.auth.otpVerify, { mobile, code, client: 'mobile' });
        return withUser(parseOrThrow(loginResultSchema, data, 'OTP verify') as LoginResult);
      },
      error => ({ ok: false, error }),
    ),

  verifyMfa: (challengeId, code) =>
    authCall<LoginResult>(
      async () => {
        const { data } = await apiClient.post(ENDPOINTS.auth.mfaVerify, { challengeId, code, client: 'mobile' });
        return withUser(parseOrThrow(loginResultSchema, data, 'MFA verify') as LoginResult);
      },
      error => ({ ok: false, error }),
    ),

  resendMfa: challengeId =>
    authCall<OtpRequestResult>(
      async () => {
        const { data } = await apiClient.post(ENDPOINTS.auth.mfaResend, { challengeId });
        return parseOrThrow(otpRequestSchema, data, 'MFA resend') as OtpRequestResult;
      },
      (error, resendIn) => ({ ok: false, error, resendIn }),
    ),

  async logout() {
    await apiClient.post(ENDPOINTS.auth.logout, {});
  },

  async changePassword(currentPassword, newPassword) {
    await apiClient.post(ENDPOINTS.auth.password, { currentPassword, newPassword });
  },

  async upsert(collection, id, body) {
    const { data } = await apiClient.put(ENDPOINTS.collectionItem(collection, id), body);
    return data;
  },

  async remove(collection, id) {
    await apiClient.delete(ENDPOINTS.collectionItem(collection, id));
  },

  async getSmsLog() {
    const { data } = await apiClient.get(ENDPOINTS.adminSms);
    return data;
  },

  async uploadMedia(albumId, file, onProgress) {
    if (!file.uri) {
      throw new ApiError({ message: 'No file selected.', status: null, code: 'BAD_FILE', isNetworkError: false });
    }
    // Same shape as the website: multipart field "files", one file per request
    // so each gets its own progress bar and retry.
    const form = new FormData();
    form.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? (file.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    } as unknown as Blob);
    const { data } = await apiClient.post<unknown>(ENDPOINTS.albumMedia(albumId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Hand the FormData to the native networking layer untouched (it adds the boundary).
      transformRequest: body => body,
      timeout: 0,
      onUploadProgress: e => onProgress(e.total ? e.loaded / e.total : 0),
    });
    return normalizeMedia(pickUploadedAsset(data, albumId, file));
  },
};
