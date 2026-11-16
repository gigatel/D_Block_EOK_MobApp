# Maps, GPS, permissions and SignalR

Always verify the latest versions, New Architecture support and peer deps before installing:
`npm view <pkg> version peerDependencies time --json`.

## Permissions

Android (`AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<!-- only if truly needed; requires Play Console declaration -->
<!-- <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" /> -->
```
iOS (`Info.plist`): `NSLocationWhenInUseUsageDescription` (+ `NSLocationAlwaysAndWhenInUseUsageDescription` and
`UIBackgroundModes: location` only for background tracking).

Flow: check → explain (pre-permission UI) → request → handle `granted | denied | blocked`
(`blocked` → `Linking.openSettings()`). Request background location separately, after foreground is granted.

Minimal Android-only request without extra deps:
```ts
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestForegroundLocation(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS: the location library prompts
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
```

## GPS

- Use a geolocation library with New Architecture support; wrap it in `src/services/location/` and expose a `useCurrentLocation` / `useLocationWatcher` hook.
- Use `distanceFilter` and sensible `interval` to save battery; stop watchers on unmount and when the app is backgrounded (unless background tracking is a feature).
- Handle: permission denied, location services off, timeout, low accuracy.

## Maps (`react-native-maps`)

- Android: Google Maps API key in `AndroidManifest.xml`:
  ```xml
  <meta-data android:name="com.google.android.geo.API_KEY" android:value="@string/google_maps_api_key"/>
  ```
  Keep the key in a non-committed resource/gradle property; restrict the key by package name + SHA-1 in Google Cloud.
- iOS: Apple Maps works by default; Google provider needs the Google Maps pod and key in `AppDelegate.swift`.
- Performance: memoise markers, use `tracksViewChanges={false}` on custom markers after first render, cluster large marker sets.

## SignalR real-time (`@microsoft/signalr`)

```ts
import * as signalR from '@microsoft/signalr';
import { getAccessToken } from '@/services/storage/tokenStorage';
import { env } from '@/config/env';

export function createHubConnection(path: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${env.API_BASE_URL}${path}`, {
      accessTokenFactory: async () => (await getAccessToken()) ?? '',
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: true, // only if the server uses WebSockets only
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(__DEV__ ? signalR.LogLevel.Information : signalR.LogLevel.Error)
    .build();
}
```
Guidelines:
- One connection per hub, owned by a service in `src/services/realtime/`; expose a hook that subscribes/unsubscribes handlers (`connection.on` / `connection.off`).
- Start after login; `stop()` on logout; on `AppState` → `background` consider stopping, and restart on `active`.
- Surface connection state (`connecting | connected | reconnecting | disconnected`) in the UI.
- Throttle high-frequency updates (e.g. live GPS positions) before setting React state.
