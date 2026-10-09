# Device authentication acceptance (0.4.3)

Date: 2026-10-09. Local acceptance preparation; real provider/device checks are still manual.

## Automated coverage

| Area | Status | Evidence |
| --- | --- | --- |
| Android callback restore | Passed locally | `android-app/tests/auth.test.cjs` accepts a restored matching `vibe://auth` callback and rejects unsolicited, expired, mismatched or wrong-scheme callbacks. |
| Android cancellation | Passed locally | `android-app/tests/auth.test.cjs` and `scripts/test-mobile-login-return.cjs` keep cancellation as a retryable error for Google and Discord. |
| Android linking return | Passed locally | `scripts/test-mobile-login-return.cjs` verifies Google and Discord linking returns `linked=1` without returning a replacement session token. |
| Expired attempts | Passed locally | Android and server return tests reject stale mobile attempts after the ten-minute window. |
| Different provider emails | Passed locally | `scripts/test-login-orphans.cjs` verifies explicit Discord linking can attach a different provider email to the existing Google-owned profile. |
| Account conflict prevention | Passed locally | `scripts/test-login-orphans.cjs` keeps matching email alone from linking a second provider and refuses identities owned by another live profile. |
| Desktop recovery | Passed locally | `electron-app/tests/startup.test.cjs` recovers a failed OAuth callback to the last VIBE page instead of retrying the provider callback URL. |
| Intermittent backend/session failures | Passed locally | `android-app/tests/auth.test.cjs` expires stored sessions on `401` but preserves them on temporary server outages. |

## Manual device checks still required

- Android APK: Google consent, cancel, retry, successful sign-in, app restart during provider flow, offline/retry, and linking Google/Discord from Settings.
- Android APK: repeat the same checks for Discord, including an account whose Discord email differs from the Google email.
- Windows EXE: Google and Discord sign-in from the packaged app, cancellation, retry from the recovery page, and recovery after an OAuth callback load failure.
- Existing account safety: verify no automatic merge occurs from matching emails; linking must start from an authenticated Settings session.

## Result

The automated acceptance layer covers callback validation, stale attempt rejection, cancellation recovery, session preservation, explicit linking and desktop OAuth recovery. It does not prove real Google/Discord consent screens, installed APK/EXE browser handoff, provider account selection, or device network behavior. Those checks remain release blockers before marking native 0.4.3 artifacts as accepted.
