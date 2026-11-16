# Release — Android (Play Store) & iOS (App Store)

React Native CLI project: builds are produced with Gradle/Xcode (EAS is not used).

## Before every release
- [ ] `npm run validate` passes; release JS bundle builds.
- [ ] `src/config/env.ts` production block: `API_BASE_URL=https://dblockeok.com`, `DATA_MODE='api'`, `SHOW_DEV_TOOLS=false`.
- [ ] Version bumped: `android/app/build.gradle` (`versionCode`++, `versionName`) and Xcode (Version, Build++).
- [ ] Tested in **release** mode on a mid-range Android (Android 10–15) and an iPhone (iOS 16+).
- [ ] No PII/tokens in logs (`src/utils/logger.ts` drops debug/info in release).
- [x] App id is **`com.dblockeok.gigatel`** on both Android (`applicationId`; Kotlin `namespace` stays `com.dblockeok`) and iOS — it cannot change after the first store upload.

## Android
1. Create the upload keystore once (keep it backed up, never commit):
   `keytool -genkeypair -v -storetype PKCS12 -keystore dblockeok-upload.keystore -alias dblockeok -keyalg RSA -keysize 2048 -validity 10000`
2. Put credentials in `~/.gradle/gradle.properties` (not the repo) and reference them in `signingConfigs.release`.
3. Enable R8: `def enableProguardInReleaseBuilds = true` in `android/app/build.gradle`; keep rules for Reanimated/Keychain if needed.
4. `cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
5. Play Console → Internal testing → Closed → Production. Complete Data safety (phone number, name, flat; push token in Phase 3), content rating, target audience.
6. For a sideload APK for committee testing: `./gradlew assembleRelease`.

## iOS
1. Bundle id is **`com.dblockeok.gigatel`** (set in the Xcode project). Set the Team in Xcode › Signing & Capabilities; register that id in the Apple Developer portal and create the app in App Store Connect with it.
2. Update `PrivacyInfo.xcprivacy` and App Privacy answers.
3. Product › Archive (Any iOS Device, Release) → Distribute → App Store Connect → TestFlight → Review.

## Fastlane (recommended, Phase 4)
`fastlane android internal` (supply) and `fastlane ios beta` (pilot); secrets in CI only.
