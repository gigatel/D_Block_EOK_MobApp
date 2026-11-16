# Store deployment checklists

## Pre-release (both platforms)
- [ ] `npm run typecheck && npm run lint && npm test` all pass.
- [ ] Production API base URL configured; no dev endpoints, no `console.log` noise.
- [ ] App tested in **release** mode on real devices (Android + iOS).
- [ ] Crash reporting configured, source maps / dSYMs uploaded.
- [ ] Version bumped on both platforms; changelog / release notes written.
- [ ] Permissions requested are all justified and described.
- [ ] Privacy policy URL live.

## Google Play
1. Create an upload keystore once (keep a secure backup, never commit):
   `keytool -genkeypair -v -storetype PKCS12 -keystore dblock-upload.keystore -alias dblock-upload -keyalg RSA -keysize 2048 -validity 10000`
2. Configure signing via `~/.gradle/gradle.properties` + `signingConfigs.release` (see `native.md`).
3. Bump `versionCode` (integer, must increase) and `versionName` in `android/app/build.gradle`.
4. Enable R8: `def enableProguardInReleaseBuilds = true`; add keep rules for reflection-based libraries.
5. `cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.
6. Play Console: enroll in Play App Signing, upload to **Internal testing** first, then closed/open testing, then production.
7. Complete: Data safety, content rating, target audience, ads declaration, permissions declarations (e.g. background location), store listing assets.
8. Ensure `targetSdkVersion` meets Play's current requirement.

## Apple App Store
1. Apple Developer account; App ID / bundle identifier matches Xcode; create the app in App Store Connect.
2. Xcode › Signing & Capabilities: Team, automatic signing (or manual profiles in CI).
3. Bump **Version** (`CFBundleShortVersionString`) and **Build** (`CFBundleVersion`, must increase).
4. App icons (1024×1024 marketing icon, no alpha), launch screen.
5. `PrivacyInfo.xcprivacy` and App Privacy answers in App Store Connect match actual data collection.
6. Product › Archive (Any iOS Device, Release) → Distribute App → App Store Connect → Upload.
7. TestFlight internal → external testing → Submit for Review with screenshots, description, demo account credentials if login is required.
8. Export compliance (encryption) answered; `ITSAppUsesNonExemptEncryption` in Info.plist to skip the prompt if applicable.

## Automation
- Fastlane: `fastlane android deploy` (supply) and `fastlane ios beta` (pilot); store keys in CI secrets.
- CI: run checks on every PR; build signed artifacts only on tags/main.
