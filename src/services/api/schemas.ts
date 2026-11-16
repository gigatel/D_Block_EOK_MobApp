/**
 * zod schemas for API responses. Responses are validated at the service
 * boundary so screens can trust the types. Schemas are permissive about extra
 * fields (forward-compatible) but strict about the fields the app relies on.
 */
import { z } from 'zod';
import { PERMISSIONS } from '@/types/models';

const iso = z.string().min(10);

// The live server sends `userId` (plus extras like flatLabel/avatarColor); the app uses `id`.
const withId = (v: unknown) =>
  v && typeof v === 'object' && !('id' in v) && 'userId' in v ? { ...v, id: (v as { userId: unknown }).userId } : v;

const sessionUserObject = z.looseObject({
  id: z.string(),
  residentId: z.string().nullish().transform(v => v ?? ''),
  name: z.string(),
  mobile: z.string().nullish().transform(v => v ?? ''),
  roles: z.array(z.string()).default(['Resident']),
  // Unknown permissions from a newer server are dropped, not fatal.
  permissions: z
    .array(z.string())
    .default([])
    .transform(ps => ps.filter((p): p is (typeof PERMISSIONS)[number] => (PERMISSIONS as readonly string[]).includes(p))),
});
export const sessionUserSchema = z.preprocess(withId, sessionUserObject);

export const loginResultSchema = z.union([
  // `token` is present once the server supports bearer sessions (API-GAPS §6.1);
  // without it the app falls back to the server's session cookie.
  // The website's server answers `{ ok: true }` and the client then reloads the session.
  z.object({ ok: z.literal(true), user: sessionUserSchema.optional(), token: z.string().min(16).optional(), expiresAt: iso.optional() }),
  z.object({ ok: z.literal('mfa'), challengeId: z.string(), mobileHint: z.string().default(''), resendIn: z.number().default(30), devSms: z.unknown().optional() }),
  z.object({ ok: z.literal(false), error: z.string(), attemptsLeft: z.number().optional(), resendIn: z.number().optional() }),
]);

export const otpRequestSchema = z.union([
  // `devSms` = the simulated SMS when the server has no SMS gateway configured (dev only).
  z.object({ ok: z.literal(true), resendIn: z.number().default(30), expiresInSec: z.number().default(300), devSms: z.unknown().optional() }),
  z.object({ ok: z.literal(false), error: z.string(), resendIn: z.number().optional() }),
]);

const eventSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  startsAt: iso,
  endsAt: iso,
  highlights: z.array(z.string()).default([]),
});
const announcementSchema = z.looseObject({ id: z.string(), title: z.string(), body: z.string(), publishedAt: iso });
const themeSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: z.string(),
  isDefault: z.boolean(),
  // Tokens/content stay `unknown` — the theme engine sanitises them.
  tokens: z.unknown(),
  content: z.unknown(),
  decorations: z.array(z.string()).default([]),
});

// Anonymous / low-privilege responses omit the user and some collections.
export const bootstrapSchema = z.looseObject({
  user: sessionUserSchema.nullish(),
  events: z.array(eventSchema).default([]),
  announcements: z.array(announcementSchema).default([]),
  themes: z.array(themeSchema).default([]),
  themeSchedules: z.array(z.looseObject({ id: z.string(), themeId: z.string(), priority: z.number() })).default([]),
  residents: z.array(z.looseObject({ id: z.string() })).default([]),
  albums: z.array(z.looseObject({ id: z.string(), visibility: z.string() })).default([]),
  media: z.array(z.looseObject({ id: z.string(), albumId: z.string() })).default([]),
  settings: z.looseObject({ siteName: z.string() }),
  serverTime: iso.optional(),
});

export const healthSchema = z.looseObject({ status: z.string(), time: z.string().optional() });

/** Validates and returns the payload, or throws a readable error. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(`Unexpected ${what} response (${first?.path.join('.') || 'root'}: ${first?.message}).`);
  }
  return result.data;
}
