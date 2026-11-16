/**
 * Every API endpoint the app calls, in one place.
 *
 * Paths are relative to `API_ROOT` (`<API_BASE_URL>/api`, set in src/config/env.ts),
 * which is the axios `baseURL`. Use them with `apiClient`:
 *
 *   apiClient.get(ENDPOINTS.bootstrap)
 *   apiClient.put(ENDPOINTS.collectionItem('events', id), body)
 *
 * Ids are URL-encoded here so callers never build paths by hand.
 */
import { env } from '@/config/env';
import type { Collection } from '@/types/bootstrap';

/** `http://10.0.0.61/api` in development — the axios baseURL. */
export const API_ROOT = `${env.API_BASE_URL}/api`;

const enc = encodeURIComponent;

export const ENDPOINTS = {
  // ---- System ----
  /** GET — server reachability `{ status, time }`. */
  health: '/health',
  /** GET — the single read model, filtered by the caller's session. */
  bootstrap: '/bootstrap',

  // ---- Auth ----
  auth: {
    /** GET — `{ user }` when signed in, `{}` otherwise. Also issues the XSRF-TOKEN cookie. */
    session: '/auth/session',
    /** POST `{ mobile, password }` → ok | mfa | error. */
    login: '/auth/login',
    /** POST `{ mobile }` → `{ ok, resendIn, devSms? }`. */
    otpRequest: '/auth/otp/request',
    /** POST `{ mobile, code }` → ok | error. */
    otpVerify: '/auth/otp/verify',
    /** POST `{ challengeId, code }` — committee two-step sign-in. */
    mfaVerify: '/auth/mfa/verify',
    /** POST `{ challengeId }`. */
    mfaResend: '/auth/mfa/resend',
    /** POST `{}`. */
    logout: '/auth/logout',
    /** POST `{ currentPassword, newPassword }`. */
    password: '/auth/password',
  },

  // ---- Writes (idempotent upsert / soft delete) ----
  /** PUT (upsert) or DELETE `/{collection}/{id}`. */
  collectionItem: (collection: Collection, id: string) => `/${collection}/${enc(id)}`,

  // ---- Media ----
  /** POST multipart — upload files into an album. */
  albumMedia: (albumId: string) => `/albums/${enc(albumId)}/media`,

  // ---- Admin ----
  /** GET — SMS delivery log. */
  adminSms: '/admin/sms',
} as const;

/** Prefix shared by all auth endpoints (a 401 from these doesn't end the session). */
export const AUTH_PREFIX = '/auth/';

/** Absolute URL for an endpoint path (for calls made outside `apiClient`). */
export const absoluteUrl = (path: string) => `${API_ROOT}${path}`;
