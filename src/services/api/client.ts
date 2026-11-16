import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { getToken } from '@/services/storage/tokenStorage';
import { logger } from '@/utils/logger';
import { API_ROOT, AUTH_PREFIX, ENDPOINTS, absoluteUrl } from './endpoints';
import { toApiError } from './errors';

let onUnauthorized: (() => void) | null = null;

/** Registered by the session store: a 401 clears the session and shows login. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/**
 * Axios instance for the ASP.NET Core API. Mobile clients authenticate with
 * `Authorization: Bearer <token>` (see docs/mobile API-GAPS §6.1) and identify
 * themselves with `X-Client: mobile` so the server returns a token instead of a cookie.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_ROOT,
  timeout: env.API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client': 'mobile',
  },
});

/**
 * Cookie-session fallback (until the server issues bearer tokens, API-GAPS §6.1):
 * the native networking layer keeps the session cookie; ASP.NET antiforgery also
 * needs the `XSRF-TOKEN` cookie echoed as `X-XSRF-TOKEN` on unsafe requests.
 * RN doesn't expose a cookie API, so the token is read from Set-Cookie headers.
 */
let xsrfToken: string | null = null;
const UNSAFE = new Set(['post', 'put', 'patch', 'delete']);

export function extractXsrf(setCookie: unknown): string | null {
  const raw = Array.isArray(setCookie) ? setCookie.join(', ') : typeof setCookie === 'string' ? setCookie : '';
  const match = /(?:^|[\s,;])XSRF-TOKEN=([^;,\s]+)/.exec(raw);
  return match ? decodeURIComponent(match[1]) : null;
}

function captureXsrf(headers: unknown) {
  const h = headers as Record<string, unknown> | undefined;
  const token = extractXsrf(h?.['set-cookie'] ?? h?.['Set-Cookie']);
  if (token && token !== xsrfToken) {
    xsrfToken = token;
    logger.debug('[api] antiforgery token received');
  }
}

// ---- Dev-only request/response log (React Native DevTools console — press `j` in Metro) ----
// Logs the full URL, headers and complete bodies. Secrets are always masked.
const SECRET_KEYS = /^(password|currentPassword|newPassword|code|otp|token|authorization|cookie|set-cookie|x-xsrf-token)$/i;

/** Deep copy of a body/headers object with secrets masked (JSON strings are parsed first). */
export function redact(body: unknown, depth = 0): unknown {
  if (typeof body === 'string') {
    if (depth === 0 && /^\s*[[{]/.test(body)) {
      try {
        return redact(JSON.parse(body), depth);
      } catch {
        // not JSON — fall through
      }
    }
    return body;
  }
  if (depth > 12) return '…';
  if (Array.isArray(body)) return body.map(b => redact(b, depth + 1));
  if (body && typeof body === 'object') {
    if (typeof FormData !== 'undefined' && body instanceof FormData) return '[multipart form data]';
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      out[k] = SECRET_KEYS.test(k) && v ? '•••' : redact(v, depth + 1);
    }
    return out;
  }
  return body;
}

type Timed = { __startedAt?: number };
type LogConfig = InternalAxiosRequestConfig & Timed;

/** Full request URL including baseURL and query params. */
const fullUrl = (c?: InternalAxiosRequestConfig) => (c ? apiClient.getUri(c) : '');
const method = (c?: InternalAxiosRequestConfig) => (c?.method ?? 'get').toUpperCase();
const elapsed = (c?: InternalAxiosRequestConfig) => Date.now() - ((c as LogConfig | undefined)?.__startedAt ?? Date.now());

if (__DEV__) {
  // Registered first → runs after the auth interceptor, so the logged headers are final.
  apiClient.interceptors.request.use(config => {
    (config as LogConfig).__startedAt = Date.now();
    logger.info(`[api] → ${method(config)} ${fullUrl(config)}`, {
      method: method(config),
      url: fullUrl(config),
      params: config.params ?? null,
      headers: redact(config.headers?.toJSON?.() ?? config.headers),
      payload: config.data === undefined ? null : redact(config.data),
    });
    return config;
  });
}

apiClient.interceptors.request.use(async config => {
  const token = await getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!token && UNSAFE.has((config.method ?? 'get').toLowerCase())) {
    if (!xsrfToken) {
      // Prime the antiforgery cookie the same way the website does.
      try {
        if (__DEV__) logger.info(`[api] → GET ${absoluteUrl(ENDPOINTS.auth.session)} (antiforgery priming)`);
        const primed = await axios.get(absoluteUrl(ENDPOINTS.auth.session), {
          timeout: env.API_TIMEOUT_MS,
          headers: { Accept: 'application/json', 'X-Client': 'mobile' },
        });
        captureXsrf(primed.headers);
      } catch {
        // The real request will surface any network error.
      }
    }
    if (xsrfToken) config.headers['X-XSRF-TOKEN'] = xsrfToken;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => {
    captureXsrf(response.headers);
    if (__DEV__) {
      logger.info(`[api] ← ${response.status} ${method(response.config)} ${fullUrl(response.config)} (${elapsed(response.config)} ms)`, {
        status: response.status,
        url: fullUrl(response.config),
        durationMs: elapsed(response.config),
        payload: response.config.data === undefined ? null : redact(response.config.data),
        response: redact(response.data),
      });
    }
    return response;
  },
  (error: AxiosError) => {
    captureXsrf(error.response?.headers);
    if (__DEV__) {
      logger.warn(
        `[api] ✕ ${error.response?.status ?? error.code ?? 'NETWORK'} ${method(error.config)} ${fullUrl(error.config)} (${elapsed(error.config)} ms)`,
        {
          status: error.response?.status ?? null,
          url: fullUrl(error.config),
          durationMs: elapsed(error.config),
          payload: error.config?.data === undefined ? null : redact(error.config.data),
          response: error.response ? redact(error.response.data) : null,
          error: error.message,
        },
      );
    }
    const isAuthCall = error.config?.url?.startsWith(AUTH_PREFIX);
    if (error.response?.status === 401 && !isAuthCall) {
      onUnauthorized?.();
    }
    return Promise.reject(toApiError(error));
  },
);

/** Retry policy for TanStack Query: never retry 4xx, retry network/5xx twice. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const e = toApiError(error);
  if (e.status !== null && e.status >= 400 && e.status < 500) {
    return false;
  }
  return failureCount < 2;
}
