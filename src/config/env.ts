/**
 * Runtime configuration (React Native CLI — no EXPO_PUBLIC_* variables).
 * Values are bundled into the JS and are therefore PUBLIC: never put secrets here.
 * Edit this file (or replace it per build flavour) to switch environments.
 */
export type DataMode = 'mock' | 'api' | 'hybrid';

type Env = {
  /** Site origin. The Node SSR server proxies /api/* — never call :5080 directly. */
  API_BASE_URL: string;
  API_TIMEOUT_MS: number;
  /**
   * 'mock'   = in-memory demo data only ("Demo data" badge)
   * 'api'    = live API only
   * 'hybrid' = live API data, demo data for anything the server returns empty;
   *            sign-in and saves use the demo service (never writes to the live DB)
   */
  DATA_MODE: DataMode;
  /** Shows developer tools (component gallery) — never in production. */
  SHOW_DEV_TOOLS: boolean;
};

/**
 * Which server debug builds talk to:
 *  - 'production' = https://dblockeok.com with live data only (same as a release build)
 *  - 'lan'        = the LAN server 10.0.0.61 in hybrid mode (live data + demo fallback)
 */
const DEV_TARGET: 'production' | 'lan' = 'production';

const lan: Env = {
  // LAN API server (HTTP is allowed only in debug builds — see AndroidManifest/Info.plist).
  API_BASE_URL: 'http://10.0.0.61',
  API_TIMEOUT_MS: 15000,
  DATA_MODE: 'hybrid',
  SHOW_DEV_TOOLS: true,
};

const production: Env = {
  API_BASE_URL: 'https://dblockeok.com',
  API_TIMEOUT_MS: 15000,
  DATA_MODE: 'api',
  SHOW_DEV_TOOLS: false,
};

const development: Env =
  DEV_TARGET === 'production' ? { ...production, SHOW_DEV_TOOLS: true } : lan;

export const env: Env = __DEV__ ? development : production;

/** Human-readable API host for diagnostics (e.g. "10.0.0.61"). */
export const apiHost = env.API_BASE_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
