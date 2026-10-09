const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TARGET_VERSION, ACCEPTED_NATIVE_VERSION, buildNativeReleaseReadiness } = require('./native-release-readiness.cjs');
const appVersionSource = require('node:fs').readFileSync('src/app/components/AppVersion.tsx', 'utf8');

test('0.5.0 package metadata is prepared while public native downloads stay pinned', () => {
  const report = buildNativeReleaseReadiness();
  assert.equal(report.targetVersion, TARGET_VERSION);
  assert.equal(report.acceptedNativeVersion, ACCEPTED_NATIVE_VERSION);
  assert.deepEqual(report.prepared.map((check) => [check.id, check.ok]), [
    ['web-version', true],
    ['android-version', true],
    ['android-version-code', true],
    ['desktop-version', true],
    ['published-manifest-pinned', true],
    ['signature-placeholder-unprovisioned', true],
  ]);
});

test('0.5.0 native release remains blocked until rebuilt artifacts and real signature exist', () => {
  const report = buildNativeReleaseReadiness();
  assert.equal(report.readyToPublishNative, false);
  assert.ok(report.blockers.some((check) => check.id === 'android-050-artifact' && !check.ok));
  assert.ok(report.blockers.some((check) => check.id === 'windows-050-artifact' && !check.ok));
  assert.ok(report.blockers.some((check) => check.id === 'real-signature' && !check.ok));
  assert.ok(report.blockers.some((check) => check.id === 'manifest-050-published' && !check.ok));
});

test('0.5.0 visible version uses the shield beta flair', () => {
  assert.match(appVersionSource, /WEB_VERSION = "0\.5\.0"/);
  assert.match(appVersionSource, /BETA_FLAIR = " 🛡️"/);
});
