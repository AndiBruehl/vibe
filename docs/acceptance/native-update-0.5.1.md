# VIBE 0.5.1 native acceptance

Status: pending real-device evidence. The local candidate is not published, and the public manifest remains at 0.5.0.6.

## Android

- [ ] Install the 0.5.1 debug APK over the existing `com.vibe.social.beta` package.
- [ ] Complete Google login; cancel once, retry, and confirm return to VIBE.
- [ ] Repeat with Discord and restart the app during provider handoff.
- [ ] With a published 0.5.1 manifest, confirm the update prompt appears before login.
- [ ] Download a matching APK and confirm the installer opens only after size and SHA-256 pass.
- [ ] Test a mismatched size and SHA-256; confirm the downloaded file is deleted and no browser fallback starts.
- [ ] Repeat update discovery/download with the Vercel manifest unavailable to confirm GitHub Raw fallback.

## Windows

- [ ] Install the 0.5.1 debug EXE and complete Google and Discord login, cancellation, retry and restart checks.
- [ ] Use Help → Check for updates against a published 0.5.1 manifest.
- [ ] Confirm the prompt displays the expected SHA-256 and byte size, and verify the downloaded EXE against both values.
- [ ] Confirm invalid manifest URL, hash or size is rejected without opening a download.

Record device model/OS, installed app version, outcome and any relevant log codes beside each completed item. Do not record account tokens or OAuth callback URLs.

## Automated emulator smoke test — 2026-10-23

- Android 15 (`Pixel_6a_API_35`): clean install of `com.vibe.social.beta` succeeded with versionCode 107 / versionName 0.5.1.
- Launch reached the VIBE sign-in screen; the app process stayed active and logcat showed no `AndroidRuntime` or `ReactNativeJS` errors.
- Google/Discord consent and the installed-update flow remain open. The emulator has no provider test account, and the public manifest is still 0.5.0.6.
