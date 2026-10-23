const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const targetVersion = '0.5.1';

test('native package metadata is prepared for 0.5.1 debug candidates', () => {
  const androidPackage = require('../android-app/package.json');
  const androidLock = require('../android-app/package-lock.json');
  const appJson = require('../android-app/app.json');
  const electronPackage = require('../electron-app/package.json');
  const electronLock = require('../electron-app/package-lock.json');
  const gradle = fs.readFileSync('android-app/android/app/build.gradle', 'utf8');

  assert.equal(androidPackage.version, targetVersion);
  assert.equal(androidLock.version, targetVersion);
  assert.equal(androidLock.packages[''].version, targetVersion);
  assert.equal(appJson.expo.version, targetVersion);
  assert.equal(appJson.expo.android.versionCode, 107);
  assert.match(gradle, /versionName "0\.5\.1"/);
  assert.match(gradle, /versionCode 107/);
  assert.equal(electronPackage.version, targetVersion);
  assert.equal(electronLock.version, targetVersion);
  assert.equal(electronLock.packages[''].version, targetVersion);
});

test('published native downloads remain pinned to accepted 0.5.0.6 artifacts', () => {
  const manifest = require('../public/releases/latest.json');
  assert.equal(manifest.android.version, '0.5.0.6');
  assert.equal(manifest.windows.version, '0.5.0.6');
  assert.match(manifest.android.downloadUrl, /0\.5\.0\.6\.apk$/);
  assert.match(manifest.windows.downloadUrl, /0\.5\.0\.6-x64\.exe$/);
});
