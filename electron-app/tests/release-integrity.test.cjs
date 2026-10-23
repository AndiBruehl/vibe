const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isValidDesktopUpdateRelease } = require("../src/releaseUpdate.cjs");

const release = {
  version: "0.5.1",
  downloadUrl: "https://raw.githubusercontent.com/AndiBruehl/vibe/main/electron-app/dist/Vibe-Setup-BETA-0.5.1-x64.exe",
  sha256: "a".repeat(64),
  sizeBytes: 1024,
};

test("desktop update metadata requires a pinned HTTPS installer and complete integrity fields", () => {
  assert.equal(isValidDesktopUpdateRelease(release), true);
  assert.equal(isValidDesktopUpdateRelease(require("../../public/releases/latest.json").windows), true);
  assert.equal(isValidDesktopUpdateRelease(require("../../docs/releases/0.5.1-candidate.json").windows), true);
  assert.equal(isValidDesktopUpdateRelease({ ...release, downloadUrl: release.downloadUrl.replace("https:", "http:") }), false);
  assert.equal(isValidDesktopUpdateRelease({ ...release, downloadUrl: "https://example.com/Vibe.exe" }), false);
  assert.equal(isValidDesktopUpdateRelease({ ...release, sha256: "bad" }), false);
  assert.equal(isValidDesktopUpdateRelease({ ...release, sizeBytes: 0 }), false);
  assert.equal(isValidDesktopUpdateRelease({ ...release, sizeBytes: Number.MAX_SAFE_INTEGER + 1 }), false);
});
