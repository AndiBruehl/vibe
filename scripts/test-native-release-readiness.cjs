const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TARGET_VERSION, ACCEPTED_NATIVE_VERSION, buildNativeReleaseReadiness } = require('./native-release-readiness.cjs');
const fs = require('node:fs');
const appVersionSource = fs.readFileSync('src/app/components/AppVersion.tsx', 'utf8');

test('0.5.0.4 package metadata is prepared while Android is published and Windows stays pinned', () => {
  const report = buildNativeReleaseReadiness();
  assert.equal(report.targetVersion, TARGET_VERSION);
  assert.equal(report.acceptedNativeVersion, ACCEPTED_NATIVE_VERSION);
  assert.deepEqual(report.prepared.map((check) => [check.id, check.ok]), [
    ['web-version', true],
    ['android-version', true],
    ['android-version-code', true],
    ['desktop-version', true],
    ['published-android-target', true],
    ['published-windows-pinned', true],
    ['signature-placeholder-unprovisioned', true],
  ]);
});

test('0.5.0.4 native release remains blocked until rebuilt artifacts and real signature exist', () => {
  const report = buildNativeReleaseReadiness();
  assert.equal(report.readyToPublishNative, false);
  assert.ok(report.blockers.some((check) => check.id === 'windows-050-artifact' && !check.ok));
  assert.ok(report.blockers.some((check) => check.id === 'real-signature' && !check.ok));
  assert.ok(report.blockers.some((check) => check.id === 'windows-050-published' && !check.ok));
});

test('0.5.0.4 visible version uses the shield beta flair', () => {
  assert.match(appVersionSource, /WEB_VERSION = "0\.5\.0\.4"/);
  assert.match(appVersionSource, /BETA_FLAIR = " 🛡️"/);
});
test('mobile auth web bridge validates tokens and recovers without a WebView HTTP failure', () => {
  const routeSource = fs.readFileSync('src/app/api/mobile/auth/web/route.ts', 'utf8');
  assert.match(routeSource, /verifyMobileToken\(token\)/);
  assert.match(routeSource, /loginFallback\(request\)/);
  assert.match(routeSource, /loginError=mobile/);
});

test('android clears stored mobile session when the auth bridge returns an HTTP error', () => {
  const appSource = fs.readFileSync('android-app/App.tsx', 'utf8');
  assert.match(appSource, /onHttpError/);
  assert.match(appSource, /nativeEvent\.url\.startsWith\(`\$\{vibeUrl\}\/api\/mobile\/auth\/web`\)/);
  assert.match(appSource, /SecureStore\.deleteItemAsync\(mobileTokenKey\)/);
  assert.match(appSource, /Your mobile session expired/);
});


test('android login verification avoids AbortSignal.timeout for React Native compatibility', () => {
  const appSource = fs.readFileSync('android-app/App.tsx', 'utf8');
  assert.match(appSource, /function fetchWithTimeout/);
  assert.match(appSource, /new AbortController\(\)/);
  assert.equal(appSource.includes('AbortSignal.timeout'), false);
});

test('android update prompt does not require a mobile token', () => {
  const appSource = fs.readFileSync('android-app/App.tsx', 'utf8');
  assert.doesNotMatch(appSource, /if \(!mobileToken\) return;\s*void getLatestAndroidRelease/);
  assert.match(appSource, /useEffect\(\(\) => \{\s*void getLatestAndroidRelease/);
  assert.match(appSource, /\{update && <View/);
});

test('android update manifest tries Vercel before GitHub raw fallback', () => {
  const appSource = fs.readFileSync('android-app/App.tsx', 'utf8');
  assert.match(appSource, /releaseManifestUrls = \[`\$\{vibeUrl\}\/releases\/latest\.json`, "https:\/\/raw\.githubusercontent\.com\/AndiBruehl\/vibe\/main\/public\/releases\/latest\.json"\]/);
  assert.match(appSource, /for \(const url of releaseManifestUrls\)/);
});
