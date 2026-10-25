const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TARGET_VERSION = '0.5.1';
const CURRENT_WEB_VERSION = '0.5.2';
const ACCEPTED_NATIVE_VERSION = '0.5.0.6';
const TARGET_ANDROID_APK = 'android-app/dist/Vibe-BETA-0.5.1.apk';
const TARGET_WINDOWS_EXE = 'electron-app/dist/Vibe-Setup-BETA-0.5.1-x64.exe';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function buildNativeReleaseReadiness() {
  const rootPackage = readJson('package.json');
  const androidPackage = readJson('android-app/package.json');
  const androidConfig = readJson('android-app/app.json');
  const desktopPackage = readJson('electron-app/package.json');
  const manifest = readJson('public/releases/latest.json');
  const signature = readJson('public/releases/latest.sig.example.json');

  const prepared = [
    { id: 'web-version', ok: rootPackage.version === CURRENT_WEB_VERSION, detail: `web package version is ${rootPackage.version}` },
    { id: 'android-version', ok: androidPackage.version === TARGET_VERSION && androidConfig.expo.version === TARGET_VERSION, detail: `android package/app version is ${androidPackage.version}/${androidConfig.expo.version}` },
    { id: 'android-version-code', ok: androidConfig.expo.android.versionCode === 107, detail: `android versionCode is ${androidConfig.expo.android.versionCode}` },
    { id: 'desktop-version', ok: desktopPackage.version === TARGET_VERSION, detail: `desktop package version is ${desktopPackage.version}` },
    { id: 'published-android-accepted', ok: manifest.android.version === ACCEPTED_NATIVE_VERSION, detail: `published android manifest remains ${manifest.android.version}` },
    { id: 'published-windows-accepted', ok: manifest.windows.version === ACCEPTED_NATIVE_VERSION, detail: `published windows manifest remains ${manifest.windows.version}` },
    { id: 'signature-placeholder-unprovisioned', ok: signature.keyId === 'unprovisioned-local-placeholder' && signature.signature === '', detail: `signature keyId is ${signature.keyId || '(missing)'}` },
  ];

  const blockers = [
    { id: 'android-051-artifact', ok: fileExists(TARGET_ANDROID_APK), detail: `${TARGET_ANDROID_APK} exists` },
    { id: 'windows-051-artifact', ok: fileExists(TARGET_WINDOWS_EXE), detail: `${TARGET_WINDOWS_EXE} exists` },
    { id: 'real-signature', ok: signature.signature !== '' && signature.keyId !== 'unprovisioned-local-placeholder', detail: 'real detached release signature is present' },
    { id: 'installed-device-acceptance', ok: false, detail: 'Android and Windows installed-flow evidence has not been recorded' },
  ];

  return {
    targetVersion: TARGET_VERSION,
    acceptedNativeVersion: ACCEPTED_NATIVE_VERSION,
    readyToPublishNative: blockers.every((check) => check.ok),
    prepared,
    blockers,
  };
}

if (require.main === module) {
  const report = buildNativeReleaseReadiness();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.prepared.every((check) => check.ok)) process.exitCode = 1;
}

module.exports = { TARGET_VERSION, CURRENT_WEB_VERSION, ACCEPTED_NATIVE_VERSION, TARGET_ANDROID_APK, TARGET_WINDOWS_EXE, buildNativeReleaseReadiness };
