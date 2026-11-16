import type { Bootstrap, Collection } from '@/types/bootstrap';
import type { MediaAsset, SessionUser, SmsLog } from '@/types/models';

/** `token` is absent when the server uses its session cookie instead of bearer auth. */
export type AuthSuccess = { ok: true; user: SessionUser; token?: string; expiresAt?: string };
/** Simulated SMS the server returns when no SMS gateway is configured (shown in debug builds). */
export type DevSms = unknown;

export type MfaChallenge = { ok: 'mfa'; challengeId: string; mobileHint: string; resendIn: number; devSms?: DevSms };
export type AuthFailure = { ok: false; error: string; attemptsLeft?: number; resendIn?: number };
export type LoginResult = AuthSuccess | MfaChallenge | AuthFailure;

export type OtpRequestResult =
  | { ok: true; resendIn: number; expiresInSec: number; devSms?: DevSms }
  | AuthFailure;

export type HealthStatus = { status: string; time?: string };

export type UploadFile = {
  name: string;
  sizeBytes: number;
  kind: MediaAsset['kind'];
  /** Local file URI from the photo library (absent for demo sample files). */
  uri?: string;
  mimeType?: string;
};

/**
 * The single contract every screen uses. Two implementations:
 *  - services/mock/mockService.ts  (DATA_MODE=mock, in-memory demo data)
 *  - services/api/apiService.ts    (DATA_MODE=api, ASP.NET Core API)
 */
export interface DataService {
  readonly mode: 'mock' | 'api' | 'hybrid';
  /** GET /api/health — server reachability check. */
  checkHealth(): Promise<HealthStatus>;
  getBootstrap(): Promise<Bootstrap>;
  getSession(): Promise<SessionUser | null>;
  login(mobile: string, password: string): Promise<LoginResult>;
  requestOtp(mobile: string): Promise<OtpRequestResult>;
  verifyOtp(mobile: string, code: string): Promise<LoginResult>;
  verifyMfa(challengeId: string, code: string): Promise<LoginResult>;
  resendMfa(challengeId: string): Promise<OtpRequestResult>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  /** PUT /api/{collection}/{id} — idempotent create-or-update. */
  upsert<T extends object>(collection: Collection, id: string, body: T): Promise<T>;
  /** DELETE /api/{collection}/{id} — soft delete. */
  remove(collection: Collection, id: string): Promise<void>;
  /** GET /api/admin/sms — SMS delivery log (admin). */
  getSmsLog(): Promise<SmsLog[]>;
  /** POST /api/albums/{albumId}/media for one file, reporting 0–1 progress. */
  uploadMedia(
    albumId: string,
    file: UploadFile,
    onProgress: (fraction: number) => void,
  ): Promise<MediaAsset>;
}
