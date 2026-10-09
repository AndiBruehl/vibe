# Device authentication manual acceptance (0.4.3.1)

Date: 2026-10-09. Manual device acceptance plan for the currently published native artifacts.

## Scope

- Android APK: `android-app/dist/Vibe-BETA-0.4.1.apk`
- Windows EXE: `electron-app/dist/Vibe-Setup-BETA-0.4.1-x64.exe`
- Release manifest: `public/releases/latest.json` still points Android and Windows to `0.4.1`
- Backend: `https://vibe-social-network.vercel.app`

## Read-only deployment check

Passed locally with:

```powershell
node scripts/check-login-deployment.cjs https://vibe-social-network.vercel.app
```

Result:

- Google callback origin matches production.
- Discord callback origin matches production.
- Anonymous session response is empty.

This does not perform OAuth consent, account writes, account linking or native browser handoff.

## Android APK acceptance checklist

Record device model, Android version, network type, installed APK version and test account names before starting.

| Case | Expected result | Evidence |
| --- | --- | --- |
| Google sign-in consent | Browser opens Google consent, returns to VIBE, and `/home` loads as the selected account. | Pending |
| Google cancel and retry | Cancellation returns to the VIBE login screen with retry text; retry starts a fresh provider flow. | Pending |
| Discord sign-in consent | Browser opens Discord consent, returns to VIBE, and `/home` loads as the selected account. | Pending |
| Discord cancel and retry | Cancellation returns to the VIBE login screen with retry text; retry starts a fresh provider flow. | Pending |
| Link Discord to Google-owned account | Starting from Settings -> Sign-in methods links Discord without replacing the current session. | Pending |
| Link provider with different email | Linking succeeds only from the authenticated Settings flow; later sign-in resolves to the same VIBE profile. | Pending |
| App restart during provider flow | Reopening VIBE resumes or safely rejects the pending attempt; no account is switched silently. | Pending |
| Offline or intermittent network | Temporary failures preserve the existing session and show retry/recovery instead of signing out. | Pending |

## Windows EXE acceptance checklist

Record Windows version, installer file name, installed app version and test account names before starting.

| Case | Expected result | Evidence |
| --- | --- | --- |
| Google sign-in consent | Provider flow completes in the packaged app and returns to `/home`. | Pending |
| Discord sign-in consent | Provider flow completes in the packaged app and returns to `/home`. | Pending |
| Cancel and retry | Cancelled provider flow remains recoverable; retry starts from VIBE rather than a stale OAuth callback. | Pending |
| Link from Settings | Google/Discord linking completes from Settings -> Sign-in methods and keeps the current session. | Pending |
| Network failure during OAuth callback | Recovery page retries the last VIBE page, not the OAuth callback URL. | Pending |
| Update/browser fallback check | External provider and APK/EXE links open through the expected browser or recovery path. | Pending |

## Release decision

`0.4.3.1` prepares the remaining real-device acceptance work and verifies production provider configuration. Native `0.4.1` artifacts must not be marked accepted until the pending rows above have recorded evidence.
