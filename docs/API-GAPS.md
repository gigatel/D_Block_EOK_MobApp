# API gaps — backend work needed for the mobile app

Status legend: ⏳ not started · 🚧 in progress · ✅ done. Backend changes follow the existing patterns
(minimal-API endpoint groups, DTOs in `Dtos.cs`, EF Core migrations, `AuditWriter`, `RequirePermission`, unit tests).

| § | Gap | Mobile status | Backend status |
|---|-----|---------------|----------------|
| 6.1 | Bearer sessions for mobile | Client ready (`apiService`, `X-Client: mobile`, `Authorization: Bearer`, 401 handling) | ⏳ |
| 6.2 | Device push tokens (`DevicePushTokens`, `PUT/DELETE /api/devices/{id}`) | Not started (Phase 3) | ⏳ |
| 6.3 | Push delivery (`PushDispatcher`, receipts, delivery log) | Admin screen placeholder | ⏳ |
| 6.4 | Notification preferences per category | Local toggles in Settings (not synced) | ⏳ |
| 6.5 | Upload progress | Client uses per-file upload with progress callback; decide on chunked uploads for videos > 200 MB | ⏳ decision |
| 6.6 | `GET /api/bootstrap?since=` deltas | Measure bootstrap size first | ⏳ optional |
| 6.7 | Server-side nudity/explicit screening on `POST /api/albums/{id}/media` | On-device check blocks before upload (D22b); shows server `error` per file | ⏳ requested |
| 6.8 | OTP sign-in for committee accounts + App Review account | App is OTP-only (D22d) | ⏳ confirm |

## 6.1 Bearer sessions (blocking Phase 2)

- `POST /api/auth/login`, `/otp/verify`, `/mfa/verify` accept `client: "mobile"` (body) or `X-Client: mobile`
  (header) and return `{ ok: true, user, token, expiresAt }`.
- Token: 256-bit random; store **only** SHA-256 in new nullable `UserSessions.TokenHash`; 12 h lifetime and the
  existing revocation rules (logout, password change).
- `SessionValidationMiddleware` / `CurrentUser` accept `Authorization: Bearer <token>`. Skip CSRF only for
  bearer-authenticated requests that carry no cookies.
- Logout revokes the session.

The mobile client already sends `client: "mobile"` and `X-Client: mobile`, and validates the response with
`loginResultSchema` (`src/services/api/schemas.ts`).

## 6.2 Device push tokens

```
DevicePushTokens(Id, UserId → UserAccounts, ResidentId, Token UNIQUE, Platform, AppVersion,
                 CreatedAt, LastSeenAt, RevokedAt?)
PUT /api/devices/{id}    register/refresh
DELETE /api/devices/{id} revoke (also on logout)
```

**Note for RN CLI:** the brief assumed Expo push tokens. Without Expo, use **FCM** (Android) and **APNs** (iOS)
tokens via `@react-native-firebase/messaging` (or Notifee + APNs). Alternatively keep Expo's push service by
adding the `expo-notifications` module to this bare project. Decide before implementing §6.3; the table should
store a `Provider` column (`fcm` | `apns` | `expo`).

## 6.3 Push delivery
Extend `Notifier.cs` and the `SmsDispatcher` outbox pattern with a `PushDispatcher` (batches, receipts,
`NotRegistered` → revoke). Same `NotificationCategory` + dedupe keys as in-app notifications, respecting user
preferences. Payload `{ title, body, data: { link, notificationId } }` with app links such as `/events/{slug}`
(the app already maps these: `src/navigation/links.ts`). Add a delivery log for the admin screen.

## 6.4 Notification preferences
Per-resident categories: announcements, events, complaints, polls, theme/admin. Push opt-out per category; SMS
consent stays `Privacy.SmsAlerts`. Add JSON `Residents.NotificationPrefs` (or extend `PrivacySettings`) and expose
it via `PUT /residents/{id}` for the resident themself.

## 6.7 Server-side explicit-content screening for uploads

The app blocks nude/explicit photos and videos on the phone (DECISIONS D22b), but
`POST /api/albums/{id}/media` accepts any authenticated client (curl, the website, an
old app build), so the client check is only a courtesy. Requested:

- Scan every uploaded image and sampled video frames before the asset becomes visible
  (e.g. Google Cloud Vision SafeSearch, AWS Rekognition `DetectModerationLabels`, or the
  same open_nsfw model server-side).
- Reject with **422** `{ ok:false, error:"This file appears to contain explicit content." }`
  (the app shows `error` on the file row), or keep the asset `status:"Rejected"` and hidden.
- Audit-log the rejection with the uploader.
- Return the created asset(s) from the upload call (the app accepts an array,
  `{ items }`, `{ media }` or one object) including `uploadedBy` as a display name.

## 6.8 OTP-only sign-in (committee accounts) and the App Review account

The app no longer offers password sign-in (DECISIONS D22d). Needed from the server:

- `POST /api/auth/otp/verify` must sign in **committee/admin accounts** too and return their
  `permissions` (e.g. `media.upload`). If the server still answers "Committee accounts must sign
  in with password + OTP", committee members cannot use admin features in the app. Answering
  `{ ok:'mfa', challengeId, … }` is also supported (the app moves to the second SMS step).
- Apple/Google reviewers cannot receive SMS: provide one review account on production with a
  **fixed OTP** (no SMS sent), limited to that number, ideally with demo-only data.

## Other observations
- `GET /api/admin/sms` is used by the Delivery status screen (`DataService.getSmsLog`).
- The extended resident profile is read-only in the app until a self-service endpoint exists.
