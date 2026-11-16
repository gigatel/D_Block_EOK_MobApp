# Decisions & assumptions — D Block EOK mobile app

Living log of decisions made while building the app. Newest last.

## Platform

| # | Decision | Why |
|---|----------|-----|
| D1 | **React Native CLI 0.88.1 (not Expo).** The brief specified Expo; the owner asked to keep the existing RN CLI project. | Existing project, already building on Android/iOS. |
| D2 | Expo → RN CLI equivalents: Expo Router → **React Navigation 7** (typed routes + deep links); `expo-secure-store` → **react-native-keychain**; `expo-haptics` → **react-native-haptic-feedback**; EAS → **Gradle / Xcode + Fastlane**; `EXPO_PUBLIC_*` → **`src/config/env.ts`**. | Same capabilities without Expo modules. |
| D3 | Pinned exact versions for native modules, preferring releases ≥ 2 weeks old, checked for RN 0.86–0.88 / New Architecture support. | Supply-chain safety and reproducible builds. |
| D4 | Android package stays **`com.dblockeok`** (template). The brief suggests `in.dblockeok.app`; changing it touches native files and the Play listing — do it once, before the first store upload. | Avoid churn; flagged for Phase 4. |

## Data & API

| # | Decision | Why |
|---|----------|-----|
| D5 | One `DataService` interface (`src/services/data/types.ts`), two implementations: `mockService` and `apiService`. Screens never import either directly. | Mock and live modes stay in sync. |
| D6 | Mock mode emulates the **server-side** filters (role, album visibility, directory privacy, secret ballots, capacity, one vote per poll). | Prototype behaves like production. |
| D7 | Read model = `GET /api/bootstrap` cached per user with TanStack Query, refetched on focus, pull-to-refresh and after writes. | Mirrors the website. |
| D8 | Writes = idempotent `PUT /api/{collection}/{id}` with client-proposed ids `prefix-base36` matching `^[a-z][a-z0-9-]{0,39}$`. | Same as the website. |
| D9 | Mobile auth = **bearer token** (API-GAPS §6.1), stored only in Keychain/Keystore. Never passwords/OTPs. 401 → clear token + cache → login with "session expired". | Cookies + CSRF are fragile in RN. |
| D10 | Mock tokens encode the user id so a demo session survives an app restart. Mock only. | Smoother demos. |
| D11 | Dates rendered in **IST** by a small fixed-offset formatter (`src/utils/date.ts`), not `Intl` time zones. | Deterministic on Hermes Android/iOS. |
| D12 | zod validates API responses at the service boundary (permissive for extra fields; theme tokens stay `unknown` and are sanitised by the engine). | Forward-compatible, safe. |

## Theme engine

| # | Decision | Why |
|---|----------|-----|
| D13 | `src/theme/engine.ts` is a pure port of the documented rules (§7): sanitise → yearly IST windows → priority/start/id ordering → weather beats priority < 15 → default. The original `theme-engine.ts`/`ThemeEngine.cs` were **not available on this machine**; rules were implemented from the spec and must be diffed against the website code in Phase 2. | Source repo not present locally. |
| D14 | Invalid token values fall back to the default theme's value (no clamping). | Matches "fall back to default theme values". |
| D15 | Patterns and decorations are built-in RN components chosen by key; server data can never inject SVG/JS/CSS. | Security requirement. |
| D16 | Whitelisted Google fonts are **not bundled in Phase 1**; `src/theme/fonts.ts` maps them to system serif/sans. Bundling = add TTFs + one map entry. | Avoid asset churn before the design is signed off. |
| D17 | Theme re-resolves every 60 s and on foreground; admin preview/simulator is device-local (Zustand) with a "Previewing — only you see this" banner. | Spec §5.4, §7. |

## UI

| # | Decision | Why |
|---|----------|-----|
| D18 | In-house component library (`src/components`) driven by theme tokens; no React Native Paper. | Full theme control. |
| D19 | Icons: **lucide-react-native** only. | One family. |
| D20 | Mock gallery photos come from `picsum.photos` seeded URLs (needs internet). Phase 3 replaces them with authenticated `/api/media/{id}/{thumb|display}`. | No real resident photos in a demo. |
| D21 | Video playback deferred to Phase 3 (`react-native-video`); Phase 1 shows posters. | Avoid a native dependency before the media API is wired. |
| D22a | Gallery upload is shown only when the signed-in user (from `/api/auth/otp/verify` or password + MFA) has `media.upload`; "Create new album" additionally needs `albums.manage`. Real files come from `react-native-image-picker` 8.3.0 (Android Photo Picker / iOS PHPicker, no storage permission) and go to `POST /api/albums/{id}/media` as multipart `files`, one file per request. | Same contract as the website's admin upload; UI driven by permissions, never role names. |
| D22b | Explicit content is screened **on-device** before upload by the local native package `modules/content-safety`: Yahoo open_nsfw (BSD-2) as a weight-quantised TFLite model (`open_nsfw.tflite`, 5.96 MB, SHA-256 `eb3b446a6a8c1a73998a76011b97cfc67bc01084c63ee195c774e71344a66442`, from devzwy/open_nsfw_android `data/nsfw2.tflite`). Photos are scored once; videos at 8 evenly spaced frames, worst frame wins. Blocked at NSFW score ≥ 0.6 (`src/services/contentSafety.ts`). Fails closed if the scanner is missing or can't read the file. Android uses LiteRT **1.4.2** (16 KB-aligned; LiteRT 2.x is compiled with Kotlin 2.4 and the app uses 2.2), iOS uses `TensorFlowLiteObjC` 2.17.0. | User choice (2026-11-13). Not a security boundary — the server must also screen (API-GAPS §6.7). |
| D22d | **Sign-in is mobile number + SMS OTP only**, for residents and committee (2026-11-14, user decision). The password form and in-app "Change password" were removed; if `/api/auth/otp/verify` answers `ok:'mfa'`, the app continues to the second SMS step. `login`/`changePassword` stay in the service layer unused. | Simpler sign-in; App Review account needs a fixed OTP (API-GAPS §6.8). |
| D22c | Each photo in an album shows its uploader (`MediaAsset.uploadedBy`, a display name on the live server) under the tile; the viewer shows "Uploaded by …". | User request. |
| D22 | Floating custom tab bar (Home · Events · Gallery · Notices · More); admin lives under More → Committee. | Family-friendly, five clear destinations. |

## Testing

| # | Decision | Why |
|---|----------|-----|
| D23 | Jest uses `jest/reanimatedMock.js` because Reanimated 4.7.1's official mock crashes under the RN 0.88 Jest preset. lucide is mapped to its CJS build in Jest. | Tooling incompatibility, upstream. |
