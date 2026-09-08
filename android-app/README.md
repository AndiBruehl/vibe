# VIBE Android

Native Expo / React Native Android client. Interface language is English and the current theme is dark.

## Local checks

```powershell
npm ci
npm test
npm run typecheck
npm run lint
```

## Build an installable test APK

Install Android SDK 36 and JDK 17 or newer, set `JAVA_HOME` to a JDK (not a JRE), and configure `android/local.properties` with the local SDK path.

```powershell
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. This bundles the JavaScript and does not need Metro. The existing Gradle configuration uses the development keystore, so this artifact is for testing; a store release needs a private production signing key.

## Google sign-in

The app opens the server's `/api/mobile/auth/google/start` endpoint in the system browser. The backend completes Google OAuth and redirects to `vibe://auth`, preserving the app's attempt identifier. The app checks the callback, validates the mobile token with `/api/mobile/profile`, then stores it in Expo SecureStore. Existing AsyncStorage tokens are migrated on first use.

The pending attempt survives process termination for ten minutes. Expired or mismatched callbacks are rejected. HTTP 401 ends an expired session; temporary connection errors do not erase it.

The companion server changes in `src/auth.ts`, `src/mobile-auth.ts` and `src/app/api/mobile/auth/google/` must be deployed to the API host used by the APK. Building an APK does not deploy those routes. Set `EXPO_PUBLIC_API_URL` at build time to test against another reachable server. The default is the VIBE production host.

## Device verification still required

- Complete Google sign-in, cancel, and retry.
- Background or terminate the app during sign-in, then return from the browser.
- Restart with and without a connection; check session restoration and expiry.
- Check bottom tabs, Android Back, keyboard and landscape insets.
- Open a four-image web post and swipe its carousel.
- Open Browse → Browse profiles, search by name/username/subtitle, try all four sort orders, and open a profile.
- Select a photo, publish, and send a message; verify errors preserve drafts.

The Android composer currently creates one-image posts; viewing up to four images is supported. Multi-image creation and post sorting are currently web features.
