---
name: react-native-mobile-development
description: Expert guidance for building, debugging, testing and shipping the DblockEOK React Native CLI (TypeScript) app on Android and iOS. Use when working on screens, navigation, UI/theming, Axios API services, auth and secure storage, Kotlin/Gradle or Swift/Xcode/CocoaPods native code, performance, Metro/Hermes debugging, maps/GPS/permissions, SignalR real-time features, Jest tests, or Play Store / App Store releases.
---

# React Native Mobile Development (DblockEOK)

You are acting as a senior React Native engineer on **DblockEOK**, a React Native **CLI** app (not Expo)
written in **TypeScript**, targeting **Android and iOS**, on the **New Architecture** (Fabric + TurboModules)
with **Hermes**.

## Project facts (verify before relying on them)

| Item | Value | Where |
|------|-------|-------|
| React Native | 0.88.1 (do **not** downgrade) | `package.json` |
| React | 19.3.0 | `package.json` |
| Node | >= 22.11 | `package.json#engines` |
| Android | AGP 9, Kotlin 2.2, compileSdk 37, targetSdk 36, minSdk 24, package `com.dblockeok` | `android/build.gradle`, `android/app/build.gradle` |
| iOS | Swift `AppDelegate` + `SceneDelegate`, CocoaPods | `ios/DblockEOK`, `ios/Podfile` |
| JS engine | Hermes (`hermesEnabled=true`) | `android/gradle.properties` |
| New Arch | `newArchEnabled=true` | `android/gradle.properties` |
| Package manager | npm (`package-lock.json`) — never mix in yarn/pnpm | |
| Product | D Block EOK RWA app (East of Kailash). Client of the existing ASP.NET Core 10 API + MySQL — never a second backend | `docs/` |
| Key libs | React Navigation 7, Reanimated 4.7 + worklets 0.13, react-native-svg 15, lucide-react-native, TanStack Query 5, Zustand 5, zod 4, axios, react-native-keychain | `package.json` |
| Data mode | `src/config/env.ts` `DATA_MODE: 'mock' \| 'api'` | demo accounts in `docs/SETUP.md` |

Re-check these with `cat package.json` / `cat android/build.gradle` when versions matter; they change over time.

## Golden rules

1. **Never** create a new RN project, run `react-native init`, or upgrade/downgrade React Native unless the user explicitly asks.
2. **Ask before destructive actions**: deleting files, `git reset/clean`, removing `ios/Pods` or `android/build`, rewriting native project files, changing bundle IDs/package names, signing configs.
3. **Verify compatibility before installing any dependency**:
   - `npm view <pkg> version peerDependencies time --json`
   - Check the library supports the **New Architecture** (look for `codegenConfig` in its `package.json`) and the installed RN version.
   - Prefer versions that have been published for at least ~2 weeks; pin exact versions for native modules.
   - Native modules require `cd ios && bundle exec pod install` and a full native rebuild (Metro reload is not enough).
4. **Make small, incremental changes** and after each step run:
   ```sh
   npm run typecheck   # tsc --noEmit
   npm run lint
   npm test
   ```
   For native changes also run `cd android && ./gradlew assembleDebug` and/or an iOS build (see `references/native.md`).
5. Keep `App.tsx` thin; real code lives in `src/`.
6. Never commit secrets (`.env`, keystores, `*.p12`, `google-services.json` containing private keys, API tokens).

## Architecture

```
src/
  app/            App shell + providers (QueryClient → Theme → ErrorBoundary → Navigation, Toast, PreviewBanner)
  navigation/     Typed root stack + custom TabBar, deep links (dblockeok://), links.ts (notification link → route)
  screens/        public/ auth/ resident/ admin/ dev/  (+ local components/ per area)
  components/     In-house UI library, theme-token driven (Text, Button, Card, Sheet, OtpInput, ThemeHero, ArtCover…)
  features/       data/ (useBootstrap, selectors, useSave/useRemove), auth/, resident/, admin/ (schemas, hooks)
  services/       data/types.ts = DataService contract; api/ (axios bearer client, zod schemas, apiService);
                  mock/ (fixtures, themes, mockService emulating server filters); auth.ts; queryClient.ts
  store/          Zustand: session, themePreview, prefs, toast
  theme/          engine.ts (PURE theme resolution + sanitisation), appTheme.ts, ThemeProvider, patterns, decorations/
  types/          models.ts (wire enums/entities), bootstrap.ts (BootstrapDto)
  utils/          date (IST, fixed offset), ids (newId), haptics, links, validation, logger
docs/             SETUP, DECISIONS, API-GAPS, TESTING, RELEASE
```

Project rules:
- Read model is `GET /api/bootstrap` via `useBootstrap()` / selectors; writes are idempotent upserts via `useSave()` with `newId(prefix)`.
- Screens import `data` from `@/services` only — never `mockService`/`apiService` directly. Mock data stays in `src/services/mock/`.
- Admin UI is driven by `useCan(permission)`, never role names. Server enforces everything.
- Themes are data: never evaluate server JS/CSS/HTML/SVG; patterns/decorations are chosen by whitelisted key. Keep `engine.ts` in sync with the website's `theme-engine.ts` and `ThemeEngine.cs`.
- Colours only from `useTheme()` tokens; animations must respect `useReduceMotion()`; icons from lucide only.
- Never test against the live database; demo numbers are fake `900000xxxx`.

Rules:
- Import via the `@/` alias (`@/components`, `@/theme`), configured in `tsconfig.json` **and** `babel.config.js` (`babel-plugin-module-resolver`) and Jest `moduleNameMapper`. All three must stay in sync.
- Dependency direction: `screens → features → components/hooks → services → utils`. `components/` must never import from `screens/` or `features/`.
- Each folder exposes a barrel `index.ts`. Avoid deep barrels inside hot paths if they create import cycles.
- Feature code that grows beyond one screen goes in `src/features/<feature>/`.

## TypeScript standards

- `strict: true` (inherited from `@react-native/typescript-config`); do not loosen it. No `any` — use `unknown` and narrow.
- Type navigation params with a `RootStackParamList` and declare the global `ReactNavigation.RootParamList` so `useNavigation()` is typed.
- Type API responses with DTO interfaces in `services/api/types.ts`; map DTOs to domain models at the service boundary.
- Prefer `type` unions for state machines (`'idle' | 'loading' | 'success' | 'error'`).
- Function components only; `React.memo` for list items; explicit `Props` types.

## React Navigation (v7)

- Packages: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, with `react-native-screens` and `react-native-safe-area-context`.
- Use **native-stack** (real native navigation, best performance), not the JS stack.
- Pattern: `RootNavigator` switches between `AuthStack` and `AppTabs` based on auth state — do not `navigate` to login after logout; let state drive it.
- Deep linking: `linking` prop on `NavigationContainer`; Android `intent-filter` in `AndroidManifest.xml`; iOS URL types + `RCTLinkingManager` in `AppDelegate.swift`.
- Theme the container from the app theme (`NavigationContainer theme={...}`).

## Professional UI/UX

- Use design tokens from `src/theme` only — no hard-coded colors/spacing in screens. Support light and dark mode via `useColorScheme`.
- Edge-to-edge is enabled on Android: always handle insets with `react-native-safe-area-context` (`SafeAreaView` edges or `useSafeAreaInsets`). Do **not** use the deprecated `SafeAreaView` from `react-native`.
- Touch targets ≥ 44×44 pt (iOS) / 48×48 dp (Android); use `hitSlop` for small icons.
- Accessibility: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`; respect font scaling (do not set `allowFontScaling={false}` globally).
- Always design **loading, empty, error and offline** states for every data screen.
- Use `Pressable` with `android_ripple` on Android and opacity feedback on iOS.
- Keyboard: `KeyboardAvoidingView` (`behavior="padding"` on iOS) or a keyboard-aware scroll; `keyboardShouldPersistTaps="handled"` on forms.
- Platform conventions: back button on Android (`BackHandler` only when needed), swipe-back on iOS; respect each platform's typography.

## REST API with Axios

- A single configured instance in `src/services/api/client.ts` (baseURL from `src/config`, timeout, JSON headers).
- **Request interceptor** attaches the access token from secure storage.
- **Response interceptor** normalises errors into an `ApiError` class (`status`, `code`, `message`, `isNetworkError`) and handles `401` with a **single-flight token refresh** (queue concurrent requests while refreshing; logout if refresh fails).
- Services are thin, typed functions per domain: `authApi.login(body): Promise<LoginResponse>`. Screens never call `axios` directly.
- Use `AbortController` (`signal`) to cancel requests on unmount/screen blur.
- Android blocks cleartext HTTP in release; use HTTPS. For a local dev server use `10.0.2.2` (emulator) or `adb reverse tcp:PORT tcp:PORT`.
- For caching/server state consider TanStack Query (verify compatibility first).

## Authentication & secure storage

- Store tokens **only** in the Keychain (iOS) / Keystore-backed storage (Android) via `react-native-keychain`. **Never** in AsyncStorage, Redux persist, or logs.
- AsyncStorage (if added) is for non-sensitive preferences only.
- Keep the access token in memory as well for fast access; persist refresh token securely.
- On logout: clear Keychain, clear in-memory state, disconnect SignalR, reset navigation via auth state.
- Biometrics: `react-native-keychain` `accessControl` / `authenticationPrompt`; add `NSFaceIDUsageDescription` to `Info.plist`.
- Never ship secrets in the JS bundle — anything in JS is extractable. Use backend-issued short-lived tokens.

## Android native (Kotlin + Gradle)

See `references/native.md` for detail. Key points:
- Entry points: `android/app/src/main/java/com/dblockeok/MainApplication.kt`, `MainActivity.kt`.
- SDK/tool versions live in `android/build.gradle` `ext {}`; app config in `android/app/build.gradle`.
- New native modules: write **TurboModules** with Codegen specs (`NativeXxx.ts`), implement in Kotlin.
- Release builds: R8/ProGuard (`enableProguardInReleaseBuilds`), signing via `~/.gradle/gradle.properties` (never commit keystore passwords), build **AAB** (`./gradlew bundleRelease`).
- Useful: `./gradlew clean`, `./gradlew assembleDebug --stacktrace`, `adb logcat *:E ReactNativeJS:V`.

## iOS native (Swift + Xcode + CocoaPods)

See `references/native.md`. Key points:
- Always open `ios/DblockEOK.xcworkspace` (not `.xcodeproj`).
- After adding/removing native deps: `cd ios && bundle install && bundle exec pod install`.
- Permissions require `Info.plist` usage strings (`NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, ...). Missing strings crash the app or cause App Store rejection.
- Keep `PrivacyInfo.xcprivacy` updated with required-reason APIs used by the app and its SDKs.
- Native module code in Swift needs an Objective-C++ bridge for TurboModules; follow the RN docs for the current version.

## Performance

- Lists: `FlatList`/`SectionList` with stable `keyExtractor`, memoised `renderItem`, `getItemLayout` for fixed rows, `windowSize`/`initialNumToRender` tuning; consider FlashList for very large lists (verify compatibility).
- Avoid inline object/function props in hot lists; use `useCallback`/`useMemo` deliberately, not everywhere.
- Keep heavy work off the JS thread; use `InteractionManager.runAfterInteractions` or native modules; animations via `Animated` with `useNativeDriver: true` or Reanimated.
- Images: correct sizes, caching; avoid huge base64 strings.
- Measure first: React DevTools Profiler, Hermes sampling profiler, Android Studio profiler, Xcode Instruments. Release-mode performance differs greatly from debug — always test perf in release.
- Remove `console.log` in production (use `src/utils/logger.ts`, which is a no-op when `!__DEV__`).

## Debugging

- **Metro**: `npm start -- --reset-cache` for stale bundles; port 8081 conflicts → `lsof -i :8081`.
- **React Native DevTools**: press `j` in Metro to open the debugger (Hermes, Chrome DevTools frontend); Console, Sources, breakpoints, React Components/Profiler.
- **Android**: `adb devices`, `adb reverse tcp:8081 tcp:8081`, `adb logcat`, Android Studio Logcat; Gradle failures → rerun with `--stacktrace --info`; clear with `cd android && ./gradlew clean`.
- **iOS**: Xcode console, `xcrun simctl`, Console.app for device logs; Pod errors → `bundle exec pod install --repo-update`; DerivedData clean as a last resort (ask first).
- Red box stack traces map to source via source maps; for release crashes symbolicate with Hermes source maps (upload to your crash reporter).
- Debug checklist: reproduce → read the full native and JS logs → isolate (JS vs native) → smallest fix → add a test.

## Maps, GPS, permissions, SignalR

See `references/maps-location-realtime.md` for setup snippets.
- Maps: `react-native-maps` (Google Maps on Android needs API key in `AndroidManifest.xml` meta-data; Apple Maps or Google on iOS).
- Location: a geolocation library with New Arch support; request **foreground first**, background only when justified (Play Store and App Store review it).
- Permissions: `react-native-permissions` or `PermissionsAndroid`; handle `granted`, `denied`, `blocked` (send user to settings with `Linking.openSettings()`).
- SignalR: `@microsoft/signalr` (pure JS, works in RN) with `withAutomaticReconnect()`, `accessTokenFactory` reading from the auth service; transport WebSockets; pause/resume on `AppState` changes; dispose on logout.

## Testing

- Unit/component tests with **Jest** (`@react-native/jest-preset`) and `react-test-renderer` (installed) or `@testing-library/react-native` (verify version compatibility before adding).
- Test files: `__tests__/` at root for app-level tests, `*.test.ts(x)` next to source for units.
- Mock native modules in `jest.setup.js` (`react-native-keychain`, `react-native-screens`, safe-area-context mocks).
- Test pure utils and API services (mock Axios adapter) exhaustively; test screens for states (loading/error/success).
- E2E: Detox or Maestro (Maestro is simplest to start). Run on CI on both platforms.

## Release & store deployment

See `references/deployment.md` for full checklists.
- Android: bump `versionCode`/`versionName` in `android/app/build.gradle`, sign with upload key, `./gradlew bundleRelease`, upload AAB to Play Console (internal testing → closed → production), complete Data Safety form, target the current required API level.
- iOS: bump `CFBundleShortVersionString` / build number in Xcode, Release scheme, Archive → Distribute → App Store Connect → TestFlight → review; App Privacy details; privacy manifest.
- Use Fastlane for repeatable builds; keep signing secrets in CI secrets.

## Workflow for any task

1. Inspect relevant files first; do not assume structure.
2. State the plan briefly; ask before destructive or native-project-wide changes.
3. Implement in small steps following the architecture above.
4. Run `npm run typecheck && npm run lint && npm test`; run native builds when native code or native deps changed.
5. Summarise every file created/modified and any manual steps (pod install, rebuild, keys).
