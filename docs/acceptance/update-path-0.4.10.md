# VIBE 0.4.10 - Installed update-path acceptance checklist

Use this checklist only with installed APK/EXE artifacts. Simulator, browser and localhost checks do not prove native update behavior.

## Preconditions

- Install the previous accepted Android APK and Windows EXE.
- Confirm the app reports its installed native version from the wrapper, not only the web changelog.
- Publish or locally host release metadata for the candidate artifact with version, download URL, SHA-256 and byte size.
- Keep the candidate APK/EXE file available for hash and size comparison.

## Android APK

- Update discovery: installed APK detects a newer Android release only when release metadata contains version, download URL, SHA-256 and byte size.
- Normal path: tapping Download retrieves the APK and launches the Android package installer.
- Integrity mismatch: when the downloaded APK byte size differs from metadata, the app deletes the bad file, explains the mismatch and opens the browser-download fallback.
- Download failure: network or HTTP failure keeps a clear retry message and opens the browser-download fallback when possible.
- Dismiss/retry: dismissing the update prompt does not corrupt the current session; retrying reuses fresh release metadata.
- Existing sign-in: an update failure does not sign the member out or change the linked account.

## Windows desktop

- Update discovery: installed EXE detects a newer Windows release only when release metadata contains version, download URL, SHA-256 and byte size.
- Dialog evidence: the update dialog shows the target version, SHA-256 and byte size before opening the download.
- Download handoff: Download update opens the release URL in the system browser.
- Unavailable check: failed manifest fetch shows the unavailable message and leaves the app usable.
- Current-version check: an equal or older release reports that the desktop app is up to date.
- Existing sign-in: an update-check failure does not alter the server-side account or local recovery page.

## Evidence to record

- Installed platform, version and build identifier.
- Release metadata version, SHA-256 and byte size.
- Screenshot or log for update discovery and dialog/banner text.
- Result for normal download/install path.
- Result for integrity mismatch or unavailable-check recovery.
- Result for retry/dismiss behavior.
