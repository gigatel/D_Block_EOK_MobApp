# Setup — D Block EOK mobile app (React Native CLI)

## Prerequisites
- Node ≥ 22.11, npm (this repo uses `package-lock.json` — don't mix yarn/pnpm)
- Android: Android Studio, SDK 36/37, JDK 17+, a device with USB debugging or an emulator
- iOS (macOS): Xcode 16+, Ruby + Bundler (`bundle install` once), CocoaPods via `bundle exec`

## Install
```sh
npm install
cd ios && bundle exec pod install && cd ..      # iOS only, after any native dependency change
```

## Configure
Edit `src/config/env.ts` (React Native CLI has no `EXPO_PUBLIC_*` variables):

| Key | Dev default | Notes |
|-----|-------------|-------|
| `API_BASE_URL` | `http://45.250.216.56` | Site origin. The Node SSR server proxies `/api/*`. Never use port 5080. Production: `https://dblockeok.com`. |
| `DATA_MODE` | `mock` | `mock` = in-memory demo data with a "Demo data" badge; `api` = live API (needs API-GAPS §6.1). |
| `SHOW_DEV_TOOLS` | `true` in dev | Component gallery + original RN welcome screen. Always `false` in release. |

Android blocks cleartext HTTP in release builds — use HTTPS in production.

## Run
```sh
npm start              # Metro (use `npm run start:reset` after changing babel.config.js)
npm run android        # build + install on device/emulator
npm run ios            # build + run on simulator
```
Physical Android device: `adb reverse tcp:8081 tcp:8081` if the app can't reach Metro.

## Demo accounts (mock mode — tests and development only)
Sign-in is **mobile number + SMS code only** (no password in the app). The login screen no longer lists these numbers; type them in. Demo SMS code: `123456`.

| Mobile | Role |
|--------|------|
| 9000000101 | Resident (Anjali Sharma, D-42) |
| 9000000102 | Admin / committee (Rajesh Malhotra) |
| 9000000103 | Editor (Priya Kapoor) — has `media.upload` + `albums.manage` |
 Upload a file named `…fail…` to see the retry flow.

## Quality checks
```sh
npm run validate       # tsc --noEmit && eslint && jest
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/a.bundle
```

## Project map
```
src/
  app/            App shell + providers (QueryClient, Theme, ErrorBoundary, Toast, Preview banner)
  navigation/     Typed stack + custom tab bar, deep links (dblockeok://, https://dblockeok.com), link router
  screens/        public/ auth/ resident/ admin/ dev/
  components/     In-house UI library (theme-token driven)
  features/       data/ (bootstrap query, selectors, save hooks), auth/, resident/, admin/
  services/       data/types.ts (contract), api/ (axios, zod, live service), mock/ (fixtures, mock service), auth.ts
  store/          Zustand: session, themePreview, prefs, toast
  theme/          engine.ts (pure), appTheme.ts, ThemeProvider, patterns, decorations, fonts
  types/          models.ts (wire enums + entities), bootstrap.ts
  utils/          date (IST), ids, haptics, links, validation, logger
docs/             SETUP, DECISIONS, API-GAPS, TESTING, RELEASE
```
