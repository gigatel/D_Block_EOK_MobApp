# Native development reference (Android + iOS)

## Android (Kotlin / Gradle)

Layout:
- `android/build.gradle` – `ext {}` SDK versions (buildTools, min/compile/target SDK, NDK, Kotlin).
- `android/app/build.gradle` – applicationId, versionCode/versionName, signingConfigs, buildTypes, `react {}` block.
- `android/gradle.properties` – `newArchEnabled`, `hermesEnabled`, `reactNativeArchitectures`, `edgeToEdgeEnabled`, JVM args.
- `android/app/src/main/AndroidManifest.xml` – permissions, activities, deep links, meta-data (e.g. Maps API key).
- `android/app/src/main/java/com/dblockeok/` – `MainApplication.kt`, `MainActivity.kt`.

Common commands:
```sh
cd android
./gradlew assembleDebug           # debug APK (fast compatibility check)
./gradlew assembleRelease         # release APK (needs signing)
./gradlew bundleRelease           # AAB for Play Store
./gradlew clean
./gradlew app:dependencies        # dependency tree
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a   # faster local build
```

Release signing (do not commit secrets): put in `~/.gradle/gradle.properties`:
```
DBLOCK_UPLOAD_STORE_FILE=dblock-upload.keystore
DBLOCK_UPLOAD_KEY_ALIAS=dblock-upload
DBLOCK_UPLOAD_STORE_PASSWORD=****
DBLOCK_UPLOAD_KEY_PASSWORD=****
```
and reference them in `signingConfigs.release` in `android/app/build.gradle`.

TurboModule (Kotlin) outline:
1. Spec `src/native/NativeDeviceInfo.ts` using `TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo')`.
2. Add `codegenConfig` to `package.json` (`name`, `type: "modules"`, `jsSrcsDir`, `android.javaPackageName`).
3. Implement `DeviceInfoModule : NativeDeviceInfoSpec` in Kotlin, register in a `BaseReactPackage`, add the package in `MainApplication.kt`.
4. Rebuild (`./gradlew assembleDebug`) — Codegen runs during the build.

Troubleshooting:
- "SDK location not found" → `android/local.properties` with `sdk.dir=/Users/<you>/Library/Android/sdk`.
- Duplicate class / Kotlin version mismatch → check `./gradlew app:dependencies`, align library Kotlin with `kotlinVersion`.
- Device can't reach Metro → `adb reverse tcp:8081 tcp:8081`.
- Cleartext HTTP blocked → use HTTPS; `usesCleartextTraffic` is only enabled for debug.

## iOS (Swift / Xcode / CocoaPods)

Layout:
- `ios/DblockEOK/AppDelegate.swift`, `SceneDelegate.swift` – app startup, `RCTReactNativeFactory`.
- `ios/DblockEOK/Info.plist` – usage descriptions, URL schemes, ATS.
- `ios/DblockEOK/PrivacyInfo.xcprivacy` – privacy manifest.
- `ios/Podfile` – pods; `min_ios_version_supported` from RN.

Commands:
```sh
bundle install                       # once, installs the pinned CocoaPods
cd ios && bundle exec pod install    # after any native dep change
open ios/DblockEOK.xcworkspace
npx react-native run-ios --simulator "iPhone 16"
xcodebuild -workspace ios/DblockEOK.xcworkspace -scheme DblockEOK \
  -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build
```

Troubleshooting:
- `pod install` fails → `bundle exec pod repo update` then retry; check Ruby/Bundler versions in `Gemfile`.
- "No bundle URL present" → Metro not running or wrong host; start `npm start`.
- Build fails after RN/native dep change → `cd ios && bundle exec pod install`; last resort (ask first): remove `ios/Pods`, `ios/build`, DerivedData.
- Signing errors → set Team in Xcode › Signing & Capabilities; bundle ID must match App Store Connect.

Info.plist usage strings commonly needed:
`NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`,
`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSFaceIDUsageDescription`,
`NSMicrophoneUsageDescription`.
