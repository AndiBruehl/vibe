const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { assertApkIntegrity, hashSha256Chunks, isValidAndroidUpdateRelease, shouldFallbackToBrowser, UpdateIntegrityError } = require("../src/lib/releaseIntegrity.ts");

const release = {
  version: "0.5.1",
  downloadUrl: "https://raw.githubusercontent.com/AndiBruehl/vibe/main/android-app/dist/Vibe-BETA-0.5.1.apk",
  sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  sizeBytes: 3,
};

function readOnce(bytes) {
  let pending = bytes;
  return () => {
    const chunk = pending;
    pending = new Uint8Array();
    return chunk;
  };
}

test("Android update manifest requires a pinned HTTPS APK URL and complete integrity metadata", () => {
  assert.equal(isValidAndroidUpdateRelease(release), true);
  assert.equal(isValidAndroidUpdateRelease(require("../../public/releases/latest.json").android), true);
  assert.equal(isValidAndroidUpdateRelease(require("../../docs/releases/0.5.1-candidate.json").android), true);
  assert.equal(isValidAndroidUpdateRelease({ ...release, downloadUrl: release.downloadUrl.replace("https:", "http:") }), false);
  assert.equal(isValidAndroidUpdateRelease({ ...release, downloadUrl: "https://example.com/Vibe.apk" }), false);
  assert.equal(isValidAndroidUpdateRelease({ ...release, sha256: "bad" }), false);
  assert.equal(isValidAndroidUpdateRelease({ ...release, sizeBytes: 3.5 }), false);
});

test("APK hashing accepts streamed chunks without keeping the full file in memory", async () => {
  const chunks = [Buffer.from("a"), Buffer.from("bc")];
  let next = 0;
  const result = await hashSha256Chunks(() => chunks[next++] ?? new Uint8Array(), async () => {});
  assert.deepEqual(result, {
    sha256: release.sha256,
    sizeBytes: 3,
  });
});

test("APK integrity accepts only the exact manifest size and SHA-256", async () => {
  const chunks = [Buffer.from("a"), Buffer.from("bc")];
  let next = 0;
  assert.deepEqual(await assertApkIntegrity(() => chunks[next++] ?? new Uint8Array(), release), {
    sha256: release.sha256,
    sizeBytes: 3,
  });
  await assert.rejects(assertApkIntegrity(readOnce(Buffer.from("abd")), release), UpdateIntegrityError);
  await assert.rejects(assertApkIntegrity(readOnce(Buffer.from("abc!")), release), UpdateIntegrityError);
});

test("integrity failures never fall back to an unverified browser download", () => {
  assert.equal(shouldFallbackToBrowser(new UpdateIntegrityError()), false);
  assert.equal(shouldFallbackToBrowser(new Error("network unavailable")), true);
});

test("APK update handler hashes the downloaded file before opening the installer", () => {
  const appSource = fs.readFileSync(require("node:path").join(__dirname, "..", "App.tsx"), "utf8");
  assert.match(appSource, /assertApkIntegrity\(\(\) => \{/);
  assert.match(appSource, /handle\.readBytes\(Math\.min\(1024 \* 1024, remainingBytes\)\)/);
  assert.match(appSource, /async function deleteDownloadedApk[\s\S]*?catch \{/);
  assert.match(appSource, /FileSystem\.getInfoAsync\(result\.uri\)[\s\S]*?if \(cause instanceof UpdateIntegrityError\) throw cause;[\s\S]*?throw new UpdateIntegrityError\("APK integrity could not be verified\."\)/);
  assert.match(appSource, /if \(shouldFallbackToBrowser\(cause\)\)/);
});
