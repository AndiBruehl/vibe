const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TARGET_VERSION = '0.5.0.1';
const ACCEPTED_NATIVE_VERSION = '0.4.1';

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
    { id: 'web-version', ok: rootPackage.version === TARGET_VERSION, detail: `web package version is ${rootPackage.version}` },
    { id: 'android-version', ok: androidPackage.version === TARGET_VERSION && androidConfig.expo.version === TARGET_VERSION, detail: `android package/app version is ${androidPackage.version}/${androidConfig.expo.version}` },
    { id: 'android-version-code', ok: androidConfig.expo.android.versionCode === 101, detail: `android versionCode is ${androidConfig.expo.android.versionCode}` },
    { id: 'desktop-version', ok: desktopPackage.version === TARGET_VERSION, detail: `desktop package version is ${desktopPackage.version}` },
    { id: 'published-manifest-pinned', ok: manifest.android.version === ACCEPTED_NATIVE_VERSION && manifest.windows.version === ACCEPTED_NATIVE_VERSION, detail: `published native manifest is android ${manifest.android.version}, windows ${manifest.windows.version}` },
    { id: 'signature-placeholder-unprovisioned', ok: signature.keyId === 'unprovisioned-local-placeholder' && signature.signature === '', detail: `signature keyId is ${signature.keyId || '(missing)'}` },
  ];

  const blockers = [
    { id: 'android-050-artifact', ok: fileExists('android-app/dist/Vibe-BETA-0.5.0.1.apk'), detail: 'android-app/dist/Vibe-BETA-0.5.0.1.apk exists' },
    { id: 'windows-050-artifact', ok: fileExists('electron-app/dist/Vibe-Setup-BETA-0.5.0.1-x64.exe'), detail: 'electron-app/dist/Vibe-Setup-BETA-0.5.0.1-x64.exe exists' },
    { id: 'real-signature', ok: signature.signature !== '' && signature.keyId !== 'unprovisioned-local-placeholder', detail: 'real detached release signature is present' },
    { id: 'manifest-050-published', ok: manifest.android.version === TARGET_VERSION && manifest.windows.version === TARGET_VERSION, detail: `published native manifest is android ${manifest.android.version}, windows ${manifest.windows.version}` },
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

module.exports = { TARGET_VERSION, ACCEPTED_NATIVE_VERSION, buildNativeReleaseReadiness };
